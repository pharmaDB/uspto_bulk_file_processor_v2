/**
 * @file This file contains the main class for processing bulk USPTO Red Book
 * patent grant files. The file can either be used as a module within other
 * source files or as a script using the default values for the 
 * UsptoPatentProcessor class. If used as a script, a ".env" file must be
 * specified with the connection string to the MongoDB database where this
 * data will be stored after being fetched and processed. 
 * 
 * @author Anthony Mancini
 * @version 2.0.0
 * @license AGPLv3
 */

import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import * as AdmZip from 'adm-zip';
import { IZipEntry } from 'adm-zip';
import * as dotenv from 'dotenv';
import { 
  UsptoPatentProcessorOptions,
  UsptoPatentSchemaData,
} from './interfaces';
import * as converters from './converters';
import * as mongoDB from './mongodb';

dotenv.config();


/**
 * An class used to perform the core patent processing functionality. This 
 * class contains code that will fetch bulk Red Book grant patent files, parse
 * out the data from these files depending on the format, and store the data
 * in mulitple possible locations, including locally, remotely, and within a 
 * MongoDB database.
 * 
 * @author Anthony Mancini
 * @version 2.0.0
 * @license AGPLv3
 */
export class UsptoPatentProcessor {

  /**
   * The starting year of the bulk patent files that will be fetched.
   */
  private readonly startYear: number = 1985;

  /**
   * The ending year for of the bulk patent files that will be fetched. The 
   * ending year is inclusive (if, for example, the value is 2000, then this
   * year will be the last year data wil be fetched).
   */
  private readonly endYear: number = new Date().getFullYear();

  /**
   * A limiter variable on the number of files that will be fetched. Can be 
   * used for testing to reduce the number of and to initially seed a database
   * with data.
   */
  private readonly fileLimit: number = Number.MAX_SAFE_INTEGER;

  /**
   * The path of a local file that will be used to track which bulk patent 
   * files have been successfully processed.
   */
  private readonly usptoSyncFilePath: string = path.join(__dirname, 'sync.json');

  /**
   * The path to a local directory where unprocessed XML data will be stored. If 
   * set to null, no files will be cached locally.
   */
  private readonly localUsptoXmlDir: string = path.join(__dirname, 'uspto_xml_data');

  /**
   * The path to a local directory where processed JSON data will be stored. If 
   * set to null, no files will be cached locally.
   */
  private readonly localUsptoJsonDir: string = path.join(__dirname, 'uspto_json_data');
  
  /**
   * The path to a remote directory where unprocessed XML data will be stored. If 
   * set to null, no files will be cached locally.
   */
  private readonly remoteUsptoXmlDir: string = null;
  
  /**
   * The path to a remote directory where processed JSON data will be stored. If 
   * set to null, no files will be cached locally.
   */
  private readonly remoteUsptoJsonDir: string = null;

  /**
   * The connection string to the MongoDB database where the data will be 
   * stored. If no connection string is provided, then the value will be pulled
   * from a ".env" file with the key "CONNECTION_STRING".
   */
  private readonly mongoDBConnectionString: string = process.env.CONNECTION_STRING !== undefined 
    ? process.env.CONNECTION_STRING 
    : null;


  /**
   * The constructor function of the UsptoPatentProcessor class.
   * 
   * @param options a set of options that can be used with the 
   * UsptoPatentProcessor class.
   * 
   * @author Anthony Mancini
   * @version 2.0.0
   * @license AGPLv3
   */
  constructor(
    options: UsptoPatentProcessorOptions = {},
  ) {
    // Setting all of the properties in the class, checking first to see if no
    // argument was provided and if so using the default values for each of the
    // properties 
    if (options.startYear !== undefined) {
      this.startYear = options.startYear;
    }

    if (options.endYear !== undefined) {
      this.endYear = options.endYear;
    }

    if (options.fileLimit !== undefined) {
      this.fileLimit = options.fileLimit;
    }

    if (options.usptoSyncFilePath !== undefined) {
      this.usptoSyncFilePath = options.usptoSyncFilePath;
    }

    if (options.localUsptoXmlDir !== undefined) {
      this.localUsptoXmlDir = options.localUsptoXmlDir;
    }

    if (options.localUsptoJsonDir !== undefined) {
      this.localUsptoJsonDir = options.localUsptoJsonDir;
    }

    if (options.remoteUsptoXmlDir !== undefined) {
      this.remoteUsptoXmlDir = options.remoteUsptoXmlDir;
    }

    if (options.remoteUsptoJsonDir !== undefined) {
      this.remoteUsptoJsonDir = options.remoteUsptoJsonDir;
    }

    if (options.mongoDBConnectionString !== undefined) {
      this.mongoDBConnectionString = options.mongoDBConnectionString;
    }
  }


  /**
   * Checks if a file is currently found in the synchronization file. If no
   * synchronization file is found, then a new one is created.
   * 
   * @param fileUrl the URL of the file that will be synchronized.
   * @returns true if the URL is found in the synchronization file, false 
   * otherwise.
   * 
   * @author Anthony Mancini
   * @version 2.0.0
   * @license AGPLv3
   */
  private isInSyncFile(
    fileUrl: string,
  ) : boolean {
    // Creating the synchronization file if one does not currently exists
    if (!fs.existsSync(this.usptoSyncFilePath)) {
      fs.writeFileSync(this.usptoSyncFilePath, '[]');
    }

    // Checking if the URL exists within the synchronization file
    let syncFileContents: string = fs.readFileSync(this.usptoSyncFilePath).toString();
    let syncUrls: string[] = JSON.parse(syncFileContents);

    return syncUrls.includes(fileUrl);
  }


  /**
   * Saves a file to the synchronization file. If no synchronization file is
   * found, then a new one is created.
   * 
   * @param fileUrl the URL of the file that will be added to the 
   * synchronization file
   * 
   * @author Anthony Mancini
   * @version 2.0.0
   * @license AGPLv3
   */
  private saveToSyncFile(fileUrl: string) : void {
    // Creating the synchronization file if one does not currently exists
    if (!fs.existsSync(this.usptoSyncFilePath)) {
      fs.writeFileSync(this.usptoSyncFilePath, '[]');
    }

    // Adding the URL to the synchronization file and saving the file
    let syncFileContents: string = fs.readFileSync(this.usptoSyncFilePath).toString();
    let syncUrls: string[] = JSON.parse(syncFileContents);

    syncUrls.push(fileUrl);

    let syncUrlsJson: string = JSON.stringify(syncUrls);

    fs.writeFileSync(this.usptoSyncFilePath, syncUrlsJson);
  }


  /**
   * The core method of the UsptoPatentProcessor class used to fetch and 
   * process all of the bulk USPTO Red book patent grant files.
   * 
   * @author Anthony Mancini
   * @version 2.0.0
   * @license AGPLv3
   */
  private async fetchAndProcessBulkUsptoZipFiles() : Promise<void> {
    // For each year starting with the startYear and ending at the endYear, 
    // fetching the link page for that year and using the page to get all of
    // the links to the compressed archive files
    for (let year = this.endYear; year >= this.startYear; year--) {
      // Creating the URL and fetching the HTML content
      let usptoBulkDataYearUrl: string = `https://bulkdata.uspto.gov/data/patent/grant/redbook/fulltext/${year}`;
      let usptoYearResponse: AxiosResponse = await axios.get(usptoBulkDataYearUrl);

      // Displaying a message to the user that the page was fetched if 
      // sucessful, otherwise an error message is displayed
      if (usptoYearResponse.status !== 200) {
        console.log(chalk.redBright(`Failed to fetch: ${usptoBulkDataYearUrl}`));
      }

      // If the fetch was sucessful, continue the fetching and processing
      if (usptoYearResponse.status === 200) {
        console.log(chalk.greenBright(`Successfully fetched: ${usptoBulkDataYearUrl}`))

        // Creating a JQuery root to parse out the Zip file links
        let html: string = usptoYearResponse.data;
        let $: cheerio.Root = cheerio.load(html);
        
        // Getting all of the links for the current USPTO year archive
        let usptoZipFileNames: string[] = $('.container table a').get()
          .map((node: any) => {
            return node.attribs.href;
          })
          .filter((fileName: string) => {
            // Removing any file that is not a zip file
            return fileName.toLowerCase().endsWith('.zip');
          })
          .filter((fileName: string) => {
            // Removing all supplemental files
            return !fileName.toLowerCase().includes('-supp.zip');
          })
          .filter((fileName: string) => {
            // Removing all DTD files
            return !fileName.toLowerCase().includes('dtd.zip');
          });

        // For each of the links, fetching the respective Zip file and 
        // processing the data using different processors depending on the
        // format of the data file
        for (let usptoZipFileName of usptoZipFileNames) {
          let usptoZipFileLink: string = usptoBulkDataYearUrl + '/' + usptoZipFileName;

          // Only performing the fetch and process if we have not currently 
          // fetched and processed the file
          if (!this.isInSyncFile(usptoZipFileLink)) {
            // Fetching the zip file with the bulk USPTO patent data
            let usptoZipFileResponse: AxiosResponse = await axios.get(usptoZipFileLink, {
                responseType: 'arraybuffer',
            });
        
            // Getting the contents of the fetch and extracting the bulk file
            // from the zip file
            let usptoZipFileContents: Buffer = usptoZipFileResponse.data;
            let usptoZipFile: AdmZip = new AdmZip(usptoZipFileContents);
            let usptoEntryFiles: IZipEntry[] = usptoZipFile.getEntries();
            let usptoEntryFile: IZipEntry = usptoEntryFiles[0];
            let usptoEntryFileName: string = usptoEntryFile.name;
            let usptoEntryBuffer: Buffer = usptoEntryFile.getData();

            // Running the data processing function to process the bulk data
            await this.processAndSaveUsptoData(
              usptoZipFileName, 
              usptoZipFileLink,
              usptoEntryFileName,
              usptoEntryBuffer
            );
          }
        }
      }
    }
  }


  /**
   * Saves a file to a local directory. If the specified directory does not
   * exist, creates the directory.
   * 
   * @param directory the name of the directory that the file wil be saved to.
   * @param fileName the name of the file that will be saved.
   * @param contents the contents of the file.
   * 
   * @author Anthony Mancini
   * @version 2.0.0
   * @license AGPLv3
   */
  private saveToLocalDirectory(
    directory: string,
    fileName: string, 
    contents: Buffer,
  ) : void {
    // If the directory provided is not null, creating a local directory (if 
    // one does not exist) and saving the file to the local directory.
    if (directory !== null) {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
      }

      // Saving the file if it doesn't already exist
      let filePath: string = path.join(directory, fileName);

      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, contents);
      }
    }
  }


  /**
   * Saves a file to a remote directory. Internally saves the file by using a
   * POST request to send the file contents and file name. Additonally, request
   * options can be provided to modify the request.
   * 
   * @param directory the name of the directory that the file wil be saved to.
   * @param fileName the name of the file that will be saved.
   * @param contents the contents of the file.
   * @param requestOptions additional options used to modify the POST request.
   * 
   * @author Anthony Mancini
   * @version 2.0.0
   * @license AGPLv3
   */
  private async saveToRemoteDirectory(
    directory: string,
    fileName: string, 
    contents: Buffer,
    requestOptions: any,
  ) : Promise<void> {
    // Posting the data to a specified endpoint
    await axios.post(directory, { 
      usptoFileName: fileName,
      usptoData: contents,
    }, requestOptions);
  }


  /**
   * Uses the AWS CLI to save a file to an AWS bucket. Note that you must run
   * "aws configure" to add temporary credentials that will be used to save the
   * file to the S3 bucket.
   */
  private async saveToAws() : Promise<void> {}


  /**
   * Processes and saves a single USPTO bulk file. This method can handle 
   * multiple formats of bulk USPTO Red Book grant bulk files, and contains
   * parsers for bulk data going back to 1980 bulk data files.
   * 
   * @param usptoZipFileName the name of the USPTO bulk zip file.
   * @param usptoZipFileUrl the URL of the USPTO bulk zip file.
   * @param usptoEntryFileName the name of the entry file extracted from the 
   * zip file.
   * @param usptoEntryFileBuffer the contents of the extracted entry file.
   * 
   * @author Anthony Mancini
   * @version 2.0.0
   * @license AGPLv3
   */
  private async processAndSaveUsptoData(
    usptoZipFileName: string,
    usptoZipFileUrl: string,
    usptoEntryFileName: string,
    usptoEntryFileBuffer: Buffer,
  ) : Promise<void> {
    // Saving the XML file in multiple locations depending on the details
    // specified in the constructor
    
    // Saving to local directories
    if (this.localUsptoXmlDir !== undefined || this.localUsptoXmlDir !== null) {
      this.saveToLocalDirectory(this.localUsptoXmlDir, usptoEntryFileName, usptoEntryFileBuffer);
    }

    if (this.remoteUsptoJsonDir !== undefined || this.remoteUsptoJsonDir !== null) {
      this.saveToLocalDirectory(this.localUsptoXmlDir, usptoEntryFileName, usptoEntryFileBuffer);
    }

    // Saving to remote directories
    if (this.remoteUsptoXmlDir !== undefined || this.remoteUsptoXmlDir !== null) {
      this.saveToRemoteDirectory(this.remoteUsptoXmlDir, usptoEntryFileName, usptoEntryFileBuffer, {});
    }

    if (this.remoteUsptoJsonDir !== undefined || this.remoteUsptoJsonDir !== null) {
      this.saveToRemoteDirectory(this.remoteUsptoXmlDir, usptoEntryFileName, usptoEntryFileBuffer, {});
    }

    // Reading the bulk XML file, and parsing out all of the patents, and
    // processing the data into a JS structure
    let usptoData: string = usptoEntryFileBuffer.toString();
    let usptoProcessedData: UsptoPatentSchemaData[];

    // Running different parsers on the data depending on the format of the 
    // data provided
    if (usptoZipFileName.substr(0, 3) === 'ipg') {
      usptoProcessedData = await converters.convertUsptoVersion4XmlDataToJs(usptoData);
    } else if (usptoZipFileName.substr(0, 3) === 'pg0') {
      usptoProcessedData = await converters.convertUsptoVersion2XmlDataToJs(usptoData);
    } else if (usptoZipFileName.substr(0, 6) === 'pftaps') {
      usptoProcessedData = await converters.convertUsptoPftapsDataToJs(usptoData);
    }

    // Saving the JSON file if an JSON directory is specified in the constructor,
    // otherwise no file is saved.
    let usptoJsonFileName: string = usptoEntryFileName.split('.')[0];
    let usptoJsonBuffer: Buffer = Buffer.from(JSON.stringify(usptoProcessedData));

    if (this.localUsptoJsonDir !== undefined || this.localUsptoJsonDir !== null) {
      this.saveToLocalDirectory(this.localUsptoJsonDir, usptoJsonFileName, usptoJsonBuffer);
    }
    
    // Syncing with the synchronization file to keep track of which files have
    // finished being fetched and processed
    this.saveToSyncFile(usptoZipFileUrl);

    // Saving the processed data to the MongoDB database if a connection string
    // was specified in the constructor or .env file 
    if (this.mongoDBConnectionString !== undefined || this.mongoDBConnectionString !== null) {
      mongoDB.saveProcessedDataToMongoDB(this.mongoDBConnectionString, usptoProcessedData)
    }
  }


  /**
   * A public function used to run the entire fetching, parsing, and processing
   * operation.
   * 
   * @author Anthony Mancini
   * @version 2.0.0
   * @license AGPLv3
   */
  public async run() : Promise<void> {
    await this.fetchAndProcessBulkUsptoZipFiles();
  }
}


/*
 * Running the code when this file is used as a script as opposed to a module
 */
if (require.main === module) {
  (async () => {
    // Creating the UsptoPatentProcessor and running the processor.
    let usptoPatentProcessor: UsptoPatentProcessor = new UsptoPatentProcessor();

    await usptoPatentProcessor.run();
  })();
}
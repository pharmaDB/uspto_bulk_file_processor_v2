/**
 * @file This file contains the MongoDB code used to write all of the
 * processed USPTO patent data to a MongoDB database.
 * 
 * @author Anthony Mancini
 * @version 2.0.0
 * @license AGPLv3
 */

import { UsptoPatentSchemaData } from './interfaces';
import * as mongoose from 'mongoose';


/**
 * Saves an array of UsptoPatentSchemaData to the MongoDB database at a given
 * connection string.
 * 
 * @param connectionString the connection string to the MongoDB database.
 * @param usptoProcessedData an array of processed USPTO data from a bulk data
 * file.
 * 
 * @author Anthony Mancini
 * @version 2.0.0
 * @license AGPLv3
 */
export async function saveProcessedDataToMongoDB(
  connectionString: string,
  usptoProcessedData: UsptoPatentSchemaData[],
) : Promise<void> {  
  // Connecting to the database and creating a connection object
  let connection = await mongoose.createConnection(connectionString);
  
  // Creating a database Schema used to represent the processed data, and 
  // creating a model from this Schema
  let UsptoDataSchema = new mongoose.Schema({
    applicationNumber: String,
    language: String,
    country: String,
    dateProduced: String,
    datePublished: String,
    dtdVersion: String,
    fileName: String,
    patentStatus: String,
    patentClaims: String,
    patentHeadings: String,
    inventionTitle: String,
    inventionId: String,
  });
  
  let UsptoData = connection.model('UsptoData', UsptoDataSchema);

  // Adding all of the unsynchronized data to the MongoDB database
  for (let usptoProcessDataRow of usptoProcessedData) {

    // Creating a new UsptoData object for our MongoDB database
    let usptoData = new UsptoData({
      patentApplicationNumber: usptoProcessDataRow.applicationNumber,
      language: usptoProcessDataRow.language,
      country: usptoProcessDataRow.country,
      dateProduced: usptoProcessDataRow.dateProduced,
      datePublished: usptoProcessDataRow.datePublished,
      dtdVersion: usptoProcessDataRow.dtdVersion,
      fileName: usptoProcessDataRow.fileName,
      patentStatus: usptoProcessDataRow.patentStatus,
      patentClaims: JSON.stringify(usptoProcessDataRow.patentClaims),
      inventionTitle: usptoProcessDataRow.inventionTitle,
      inventionId: usptoProcessDataRow.inventionId,
    });

    // Saving the object to the database
    await usptoData.save();
  }
}

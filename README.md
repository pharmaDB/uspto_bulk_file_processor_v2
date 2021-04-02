# USPTO Bulk Data Scraper and Synchronizer

## Introduction

This repository contains the code used to scrape, parse, and store all of the data in the bulk USPTO patent files into a MongoDB database. The code keeps track of which data has already been fetched and processed from the USPTO's bulk database repository by means of local caches, and only fetches and processes data that has not yet been processed.

## Usage

The `index.ts` file can be used as both a script and a module. If used as a script a `.env` will be read to get the connection string used to connect to the MongoDB database. The format of the `.env` file should be:

```
CONNECTION_STRING=<your_mongodb_connection_string>
```

After the connection string is set, the script can be built with the following command:

```
npm run build
```

And after it is built it can be run with the following command:

```
npm run sync
```

When used as a module, an exported `synchronize` function can be called to synchronzie all of the data. For more documentation on other functions that can be called and options they can take, please see the below documentation section.

## Documentation

Below is the documentation for all of the functions within this module:

# Class: UsptoPatentProcessor

A class used to perform the core patent processing functionality. This
class contains code that will fetch bulk Red Book grant patent files, parse
out the data from these files depending on the format, and store the data
in mulitple possible locations, including locally, remotely, and within a
MongoDB database.

**`author`** Anthony Mancini

**`version`** 2.0.0

**`license`** AGPLv3

## Table of contents

### Constructors

- [constructor](README.md#constructor)

### Properties

- [endYear](README.md#endyear)
- [fileLimit](README.md#filelimit)
- [localUsptoJsonDir](README.md#localusptojsondir)
- [localUsptoXmlDir](README.md#localusptoxmldir)
- [mongoDBConnectionString](README.md#mongodbconnectionstring)
- [remoteUsptoJsonDir](README.md#remoteusptojsondir)
- [remoteUsptoXmlDir](README.md#remoteusptoxmldir)
- [startYear](README.md#startyear)
- [usptoSyncFilePath](README.md#usptosyncfilepath)

### Methods

- [fetchAndProcessBulkUsptoZipFiles](README.md#fetchandprocessbulkusptozipfiles)
- [isInSyncFile](README.md#isinsyncfile)
- [processAndSaveUsptoData](README.md#processandsaveusptodata)
- [run](README.md#run)
- [saveToAws](README.md#savetoaws)
- [saveToLocalDirectory](README.md#savetolocaldirectory)
- [saveToRemoteDirectory](README.md#savetoremotedirectory)
- [saveToSyncFile](README.md#savetosyncfile)

## Constructors

### constructor

\+ **new UsptoPatentProcessor**(`options?`: UsptoPatentProcessorOptions): [*UsptoPatentProcessor*](usptopatentprocessor.md)

The constructor function of the UsptoPatentProcessor class.

**`author`** Anthony Mancini

**`version`** 2.0.0

**`license`** AGPLv3

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`options` | UsptoPatentProcessorOptions | a set of options that can be used with the UsptoPatentProcessor class.    |

**Returns:** [*UsptoPatentProcessor*](usptopatentprocessor.md)

Defined in: index.ts:101

## Properties

### endYear

• `Private` `Readonly` **endYear**: *number*

The ending year for of the bulk patent files that will be fetched. The
ending year is inclusive (if, for example, the value is 2000, then this
year will be the last year data wil be fetched).

Defined in: index.ts:55

___

### fileLimit

• `Private` `Readonly` **fileLimit**: *number*

A limiter variable on the number of files that will be fetched. Can be
used for testing to reduce the number of and to initially seed a database
with data.

Defined in: index.ts:62

___

### localUsptoJsonDir

• `Private` `Readonly` **localUsptoJsonDir**: *string*

The path to a local directory where processed JSON data will be stored. If
set to null, no files will be cached locally.

Defined in: index.ts:80

___

### localUsptoXmlDir

• `Private` `Readonly` **localUsptoXmlDir**: *string*

The path to a local directory where unprocessed XML data will be stored. If
set to null, no files will be cached locally.

Defined in: index.ts:74

___

### mongoDBConnectionString

• `Private` `Readonly` **mongoDBConnectionString**: *string*

The connection string to the MongoDB database where the data will be
stored. If no connection string is provided, then the value will be pulled
from a ".env" file with the key "CONNECTION_STRING".

Defined in: index.ts:99

___

### remoteUsptoJsonDir

• `Private` `Readonly` **remoteUsptoJsonDir**: *string*= null

The path to a remote directory where processed JSON data will be stored. If
set to null, no files will be cached locally.

Defined in: index.ts:92

___

### remoteUsptoXmlDir

• `Private` `Readonly` **remoteUsptoXmlDir**: *string*= null

The path to a remote directory where unprocessed XML data will be stored. If
set to null, no files will be cached locally.

Defined in: index.ts:86

___

### startYear

• `Private` `Readonly` **startYear**: *number*= 1985

The starting year of the bulk patent files that will be fetched.

Defined in: index.ts:48

___

### usptoSyncFilePath

• `Private` `Readonly` **usptoSyncFilePath**: *string*

The path of a local file that will be used to track which bulk patent
files have been successfully processed.

Defined in: index.ts:68

## Methods

### fetchAndProcessBulkUsptoZipFiles

▸ `Private`**fetchAndProcessBulkUsptoZipFiles**(): *Promise*<void\>

The core method of the UsptoPatentProcessor class used to fetch and
process all of the bulk USPTO Red book patent grant files.

**`author`** Anthony Mancini

**`version`** 2.0.0

**`license`** AGPLv3

**Returns:** *Promise*<void\>

Defined in: index.ts:223

___

### isInSyncFile

▸ `Private`**isInSyncFile**(`fileUrl`: *string*): *boolean*

Checks if a file is currently found in the synchronization file. If no
synchronization file is found, then a new one is created.

**`author`** Anthony Mancini

**`version`** 2.0.0

**`license`** AGPLv3

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`fileUrl` | *string* | the URL of the file that will be synchronized.   |

**Returns:** *boolean*

true if the URL is found in the synchronization file, false
otherwise.

Defined in: index.ts:170

___

### processAndSaveUsptoData

▸ `Private`**processAndSaveUsptoData**(`usptoZipFileName`: *string*, `usptoZipFileUrl`: *string*, `usptoEntryFileName`: *string*, `usptoEntryFileBuffer`: *Buffer*): *Promise*<void\>

Processes and saves a single USPTO bulk file. This method can handle
multiple formats of bulk USPTO Red Book grant bulk files, and contains
parsers for bulk data going back to 1980 bulk data files.

**`author`** Anthony Mancini

**`version`** 2.0.0

**`license`** AGPLv3

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`usptoZipFileName` | *string* | the name of the USPTO bulk zip file.   |
`usptoZipFileUrl` | *string* | the URL of the USPTO bulk zip file.   |
`usptoEntryFileName` | *string* | the name of the entry file extracted from the zip file.   |
`usptoEntryFileBuffer` | *Buffer* | the contents of the extracted entry file.    |

**Returns:** *Promise*<void\>

Defined in: index.ts:386

___

### run

▸ **run**(): *Promise*<void\>

A public function used to run the entire fetching, parsing, and processing
operation.

**`author`** Anthony Mancini

**`version`** 2.0.0

**`license`** AGPLv3

**Returns:** *Promise*<void\>

Defined in: index.ts:457

___

### saveToAws

▸ `Private`**saveToAws**(): *Promise*<void\>

Uses the AWS CLI to save a file to an AWS bucket. Note that you must run
"aws configure" to add temporary credentials that will be used to save the
file to the S3 bucket.

**Returns:** *Promise*<void\>

Defined in: index.ts:368

___

### saveToLocalDirectory

▸ `Private`**saveToLocalDirectory**(`directory`: *string*, `fileName`: *string*, `contents`: *Buffer*): *void*

Saves a file to a local directory. If the specified directory does not
exist, creates the directory.

**`author`** Anthony Mancini

**`version`** 2.0.0

**`license`** AGPLv3

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`directory` | *string* | the name of the directory that the file wil be saved to.   |
`fileName` | *string* | the name of the file that will be saved.   |
`contents` | *Buffer* | the contents of the file.    |

**Returns:** *void*

Defined in: index.ts:313

___

### saveToRemoteDirectory

▸ `Private`**saveToRemoteDirectory**(`directory`: *string*, `fileName`: *string*, `contents`: *Buffer*, `requestOptions`: *any*): *Promise*<void\>

Saves a file to a remote directory. Internally saves the file by using a
POST request to send the file contents and file name. Additonally, request
options can be provided to modify the request.

**`author`** Anthony Mancini

**`version`** 2.0.0

**`license`** AGPLv3

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`directory` | *string* | the name of the directory that the file wil be saved to.   |
`fileName` | *string* | the name of the file that will be saved.   |
`contents` | *Buffer* | the contents of the file.   |
`requestOptions` | *any* | additional options used to modify the POST request.    |

**Returns:** *Promise*<void\>

Defined in: index.ts:349

___

### saveToSyncFile

▸ `Private`**saveToSyncFile**(`fileUrl`: *string*): *void*

Saves a file to the synchronization file. If no synchronization file is
found, then a new one is created.

**`author`** Anthony Mancini

**`version`** 2.0.0

**`license`** AGPLv3

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`fileUrl` | *string* | the URL of the file that will be added to the synchronization file    |

**Returns:** *void*

Defined in: index.ts:197

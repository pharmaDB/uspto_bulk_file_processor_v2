/**
 * @file This file contains interfaces used throughout the other modules to
 * represent function options and patent data shapes.
 * 
 * @author Anthony Mancini
 * @version 2.0.0
 * @license AGPLv3
 */


/**
 * An interface to represent the options the UsptoPatentProcessor can take in
 * its constructor function.
 */
export interface UsptoPatentProcessorOptions {
  startYear?: number,
  endYear?: number,
  fileLimit?: number,
  usptoSyncFilePath?: string,
  localUsptoXmlDir?: string,
  localUsptoJsonDir?: string,
  remoteUsptoXmlDir?: string,
  remoteUsptoJsonDir?: string,
  mongoDBConnectionString?: string,
}


/**
 * An interface to represent processed USPTO patent data from the XML files.
 */
export interface UsptoPatentData {
  applicationNumber: string,
  language: string,
  country: string,
  dateProduced: string,
  datePublished: string,
  dtdVersion: string,
  fileName: string,
  patentStatus: string,
  patentAbstract: string[],
  patentClaims: string[],
  inventionTitle: string,
  inventionId: string,
}


/**
 * Represents the MongoDB Schema form of the processed XML USPTO data.
 */
export interface UsptoPatentSchemaData {
  applicationNumber: string,
  language: string,
  country: string,
  dateProduced: string,
  datePublished: string,
  dtdVersion: string,
  fileName: string,
  patentStatus: string,
  patentClaims: string,
  inventionTitle: string,
  inventionId: string,
}

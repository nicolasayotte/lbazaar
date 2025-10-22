import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Builds certificate metadata from template and input data
 * @param {Object} inputData - The metadata input containing certificate details
 * @param {string} assetName - The asset name for the certificate
 * @param {string} imageUrl - IPFS URL for the certificate image
 * @returns {Promise<Object>} CIP-25 compliant metadata object
 */
export async function buildCertificateMetadata(inputData, assetName, imageUrl) {
  try {
    // Load the certificate template - resolve relative to project root
    const projectRoot = path.resolve(__dirname, '../..');
    const templatePath = path.join(projectRoot, 'templates', 'class-certificate.json');
    const templateContent = await fs.readFile(templatePath, 'utf8');
    let template = templateContent;

    // Define template mappings
    const mappings = {
      '{{asset_name}}': assetName,
      '{{course_title}}': inputData.course_title || '',
      '{{cohort}}': inputData.cohort || '1',
      '{{image_cid}}': imageUrl.replace('ipfs://', ''),
      '{{course_id}}': inputData.course_id || '',
      '{{teacher_name}}': inputData.teacher_name || '',
      '{{awarded_at}}': inputData.completion_date || new Date().toISOString(),
      '{{grade}}': inputData.grade || 'Pass',
      '{{score}}': inputData.score || '100',
      '{{certificate_id}}': inputData.serial_number || '',
      '{{student_name}}': inputData.student_name || '',
      '{{student_email}}': inputData.student_email || ''
    };

    // Replace all template variables
    for (const [placeholder, value] of Object.entries(mappings)) {
      template = template.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    // Parse the populated template
    const metadata = JSON.parse(template);

    return metadata;
  } catch (error) {
    throw new Error(`Failed to build certificate metadata: ${error.message}`);
  }
}

/**
 * Builds the CIP-25 metadata structure for certificate NFT
 * @param {string} policyId - The minting policy ID
 * @param {string} assetName - The asset name for the certificate
 * @param {Object} inputData - The metadata input containing certificate details
 * @param {string} imageUrl - IPFS URL for the certificate image
 * @returns {Promise<Object>} Complete CIP-25 metadata object
 */
export async function buildCIP25Metadata(policyId, assetName, inputData, imageUrl) {
  try {
    const certificateMetadata = await buildCertificateMetadata(inputData, assetName, imageUrl);

    return {
      [policyId]: certificateMetadata,
      version: 1
    };
  } catch (error) {
    throw new Error(`Failed to build CIP-25 metadata: ${error.message}`);
  }
}

/**
 * Builds custom metadata for certificate details (label 674)
 * @param {Object} inputData - The metadata input containing certificate details
 * @returns {Object} Custom metadata object for label 674
 */
export function buildCustomMetadata(inputData) {
  return {
    msg: [
      'Certificate of Completion',
      `Course: ${inputData.course_title || 'Unknown Course'}`,
      `Student: ${inputData.student_name || 'Unknown Student'}`,
      `Teacher: ${inputData.teacher_name || 'Unknown Teacher'}`,
      `Date: ${inputData.completion_date || new Date().toISOString()}`
    ]
  };
}

/**
 * Builds ticket metadata from template and input data
 * @param {Object} inputData - The metadata input containing ticket details
 * @param {string} assetName - The asset name for the ticket
 * @param {string} imageUrl - IPFS URL for the ticket image
 * @returns {Promise<Object>} CIP-25 compliant metadata object
 */
export async function buildTicketMetadata(inputData, assetName, imageUrl) {
  try {
    // Load the ticket template - resolve relative to project root
    const projectRoot = path.resolve(__dirname, '../..');
    const templatePath = path.join(projectRoot, 'templates', 'class-ticket.json');
    const templateContent = await fs.readFile(templatePath, 'utf8');
    let template = templateContent;

    // Define template mappings
    const mappings = {
      '{{asset_name}}': assetName,
      '{{course_title}}': inputData.course_title || '',
      '{{cohort}}': inputData.cohort || '1',
      '{{seat_number}}': inputData.seat_number || '',
      '{{image_cid}}': imageUrl.replace('ipfs://', ''),
      '{{course_id}}': inputData.course_id || '',
      '{{teacher_name}}': inputData.teacher_name || '',
      '{{valid_from}}': inputData.valid_from || '',
      '{{valid_until}}': inputData.valid_until || ''
    };

    // Replace all template variables
    for (const [placeholder, value] of Object.entries(mappings)) {
      template = template.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    // Parse the populated template
    const metadata = JSON.parse(template);

    return metadata;
  } catch (error) {
    throw new Error(`Failed to build ticket metadata: ${error.message}`);
  }
}

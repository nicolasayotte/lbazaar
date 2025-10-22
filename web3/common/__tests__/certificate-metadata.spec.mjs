import { describe, expect, it } from 'vitest';

import {
  buildCertificateMetadata,
  buildCIP25Metadata,
  buildCustomMetadata,
  buildTicketMetadata,
} from '../certificate-metadata.mjs';

describe('certificate-metadata helpers', () => {
  it('buildCertificateMetadata uses actual template and replaces placeholders correctly', async () => {
    const input = {
      course_title: 'Blockchain 101',
      cohort: '2',
      imageUrl: 'ipfs://test-image',
      course_id: 'COURSE-01',
      teacher_name: 'Ada Lovelace',
      completion_date: '2024-05-01T00:00:00Z',
      grade: 'A',
      score: '95',
      serial_number: 'CERT-123',
      student_name: 'Satoshi',
      student_email: 'satoshi@example.com',
    };

    const result = await buildCertificateMetadata(input, '43455254', 'ipfs://QmImage');

    // Verify the asset key is correct
    const assetKey = Object.keys(result)[0];
    expect(assetKey).toBe('43455254');

    // Verify template structure is preserved from class-certificate.json
    const assetData = result[assetKey];
    expect(assetData).toHaveProperty('name');
    expect(assetData).toHaveProperty('cohort');
    expect(assetData).toHaveProperty('image');
    expect(assetData).toHaveProperty('mediaType');
    expect(assetData).toHaveProperty('description');
    expect(assetData).toHaveProperty('course');
    expect(assetData).toHaveProperty('credential');

    // Verify course structure from template
    expect(assetData.course).toHaveProperty('id');
    expect(assetData.course).toHaveProperty('teacher');
    expect(assetData.course).toHaveProperty('title');

    // Verify credential structure from template
    expect(assetData.credential).toHaveProperty('type');
    expect(assetData.credential).toHaveProperty('awarded_at');
    expect(assetData.credential).toHaveProperty('grade');
    expect(assetData.credential).toHaveProperty('score');
    expect(assetData.credential).toHaveProperty('certificate_id');
    expect(assetData.credential).toHaveProperty('student');

    // Verify credential type array from template
    expect(assetData.credential.type).toEqual(['CourseCompletion', 'OpenBadgeV3']);

    // Verify placeholder replacements
    expect(assetData.name).toBe('Certificate — Blockchain 101 (Cohort 2)');
    expect(assetData.image).toBe('QmImage');
    expect(assetData.course.title).toBe('Blockchain 101');
    expect(assetData.course.teacher).toBe('Ada Lovelace');
    expect(assetData.credential.certificate_id).toBe('CERT-123');
    expect(assetData.mediaType).toBe('image/png');
    expect(assetData.description).toBe('Awarded upon successful completion.');
  });

  it('buildCertificateMetadata falls back to defaults when fields missing', async () => {
    const result = await buildCertificateMetadata({}, '44454641554c54', 'ipfs://default-image');
    const assetKey = Object.keys(result)[0];
    const assetData = result[assetKey];

    // Verify template structure is still preserved
    expect(assetData).toHaveProperty('course');
    expect(assetData).toHaveProperty('credential');

    // Verify defaults are applied
    expect(assetData.course.title).toBe('');
    expect(assetData.credential.grade).toBe('Pass');
    expect(assetData.credential.score).toBe('100');
    expect(assetData.credential.student.name).toBe('');
    expect(assetData.cohort).toBe('1'); // default cohort
  });

  it('buildTicketMetadata uses actual template and replaces placeholders correctly', async () => {
    const input = {
      course_title: 'DeFi Basics',
      cohort: '3',
      seat_number: '42',
      course_id: 'COURSE-02',
      teacher_name: 'Vitalik',
      valid_from: '2024-06-01T00:00:00Z',
      valid_until: '2024-12-31T23:59:59Z',
    };

    const result = await buildTicketMetadata(input, '5449434b4554', 'ipfs://QmTicketImage');

    // Verify the asset key is correct
    const assetKey = Object.keys(result)[0];
    expect(assetKey).toBe('5449434b4554');

    // Verify template structure is preserved from class-ticket.json
    const assetData = result[assetKey];
    expect(assetData).toHaveProperty('name');
    expect(assetData).toHaveProperty('image');
    expect(assetData).toHaveProperty('mediaType');
    expect(assetData).toHaveProperty('description');
    expect(assetData).toHaveProperty('course');
    expect(assetData).toHaveProperty('ticket');

    // Verify course structure from template
    expect(assetData.course).toHaveProperty('id');
    expect(assetData.course).toHaveProperty('title');
    expect(assetData.course).toHaveProperty('provider');
    expect(assetData.course).toHaveProperty('teacher');

    // Verify ticket structure from template
    expect(assetData.ticket).toHaveProperty('valid_from');
    expect(assetData.ticket).toHaveProperty('valid_until');
    expect(assetData.ticket).toHaveProperty('terms_url');
    expect(assetData.ticket).toHaveProperty('transferable');

    // Verify placeholder replacements
    expect(assetData.name).toBe('DeFi Basics — Cohort 3 Seat #42');
    expect(assetData.image).toBe('QmTicketImage');
    expect(assetData.course.title).toBe('DeFi Basics');
    expect(assetData.course.teacher).toBe('Vitalik');
    expect(assetData.ticket.valid_from).toBe('2024-06-01T00:00:00Z');
    expect(assetData.ticket.valid_until).toBe('2024-12-31T23:59:59Z');
    expect(assetData.mediaType).toBe('image/png');
    expect(assetData.description).toBe('Admission ticket for DeFi Basics (online).');
    expect(assetData.course.provider).toBe('L-Earning Bazaar');
    expect(assetData.ticket.transferable).toBe(true);
  });

  it('buildTicketMetadata falls back to defaults when fields missing', async () => {
    const result = await buildTicketMetadata({}, '44454641554c54', 'ipfs://default-ticket');
    const assetKey = Object.keys(result)[0];
    const assetData = result[assetKey];

    // Verify template structure is still preserved
    expect(assetData).toHaveProperty('course');
    expect(assetData).toHaveProperty('ticket');

    // Verify defaults are applied
    expect(assetData.course.title).toBe('');
    expect(assetData.ticket.valid_from).toBe('');
    expect(assetData.ticket.valid_until).toBe('');
    // Verify the name includes the default cohort
    expect(assetData.name).toBe(' — Cohort 1 Seat #');
  });

  it('buildCIP25Metadata wraps certificate metadata with policy', async () => {
    const input = {
      course_title: 'Web3 Development',
      teacher_name: 'Nakamoto',
      student_name: 'Alice',
    };

    const metadata = await buildCIP25Metadata('policy123', '43455254', input, 'ipfs://asset');

    // Verify CIP-25 structure
    expect(metadata).toHaveProperty('policy123');
    expect(metadata).toHaveProperty('version');
    expect(metadata.version).toBe(1);

    // Verify the wrapped certificate metadata preserves template structure
    const policyData = metadata.policy123;
    const assetData = policyData['43455254'];
    expect(assetData).toHaveProperty('course');
    expect(assetData).toHaveProperty('credential');
    expect(assetData.course.title).toBe('Web3 Development');
    expect(assetData.course.teacher).toBe('Nakamoto');
    expect(assetData.credential.student.name).toBe('Alice');
  });

  it('buildCustomMetadata returns descriptive messages', () => {
    const custom = buildCustomMetadata({
      course_title: 'Intro to DeFi',
      student_name: 'Alice',
      teacher_name: 'Bob',
      completion_date: '2024-05-01T00:00:00Z',
    });

    expect(custom).toHaveProperty('msg');
    expect(Array.isArray(custom.msg)).toBe(true);
    expect(custom.msg).toEqual([
      'Certificate of Completion',
      'Course: Intro to DeFi',
      'Student: Alice',
      'Teacher: Bob',
      'Date: 2024-05-01T00:00:00Z',
    ]);
  });
});

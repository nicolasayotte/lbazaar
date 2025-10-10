import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockReadFile = vi.hoisted(() => vi.fn());

vi.mock('fs/promises', () => ({
  default: {
    readFile: mockReadFile,
  },
}));

import {
  buildCertificateMetadata,
  buildCIP25Metadata,
  buildCustomMetadata,
} from '../certificate-metadata.mjs';

describe('certificate-metadata helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockResolvedValue(`{
  "{{asset_name}}": {
    "name": "Certificate — {{course_title}} (Cohort {{cohort}})",
    "cohort": "{{cohort}}",
    "image": "{{image_cid}}",
    "mediaType": "image/png",
    "description": "Awarded upon successful completion.",
    "course": {
      "id": "{{course_id}}",
      "teacher": "{{teacher_name}}",
      "title": "{{course_title}}"
    },
    "credential": {
      "type": [
        "CourseCompletion",
        "OpenBadgeV3"
      ],
      "awarded_at": "{{awarded_at}}",
      "grade": "{{grade}}",
      "score": "{{score}}",
      "certificate_id": "{{certificate_id}}",
      "student": {
        "name": "{{student_name}}",
        "email": "{{student_email}}"
      }
    }
  }
}`);
  });

  it('buildCertificateMetadata replaces placeholders with provided data', async () => {
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

    expect(mockReadFile).toHaveBeenCalledWith(
      expect.stringContaining('templates/class-certificate.json'),
      'utf8',
    );

    const assetKey = Object.keys(result)[0];
    expect(assetKey).toBe('43455254');
    expect(result[assetKey].name).toBe('Certificate — Blockchain 101 (Cohort 2)');
    expect(result[assetKey].image).toBe('QmImage');
    expect(result[assetKey].course.title).toBe('Blockchain 101');
    expect(result[assetKey].course.teacher).toBe('Ada Lovelace');
    expect(result[assetKey].credential.certificate_id).toBe('CERT-123');
  });

  it('buildCertificateMetadata falls back to defaults when fields missing', async () => {
  const result = await buildCertificateMetadata({}, '44454641554c54', 'ipfs://default-image');
    const assetKey = Object.keys(result)[0];
    expect(result[assetKey].course.title).toBe('');
    expect(result[assetKey].credential.grade).toBe('Pass');
    expect(result[assetKey].credential.score).toBe('100');
    expect(result[assetKey].credential.student.name).toBe('');
  });

  it('buildCIP25Metadata wraps certificate metadata with policy', async () => {
    const metadata = await buildCIP25Metadata('policy123', '43455254', {}, 'ipfs://asset');
    expect(metadata).toHaveProperty('policy123');
    expect(metadata.version).toBe(1);
  });

  it('buildCustomMetadata returns descriptive messages', () => {
    const custom = buildCustomMetadata({
      course_title: 'Intro to DeFi',
      student_name: 'Alice',
      teacher_name: 'Bob',
      completion_date: '2024-05-01T00:00:00Z',
    });

    expect(custom.msg).toEqual([
      'Certificate of Completion',
      'Course: Intro to DeFi',
      'Student: Alice',
      'Teacher: Bob',
      'Date: 2024-05-01T00:00:00Z',
    ]);
  });
});

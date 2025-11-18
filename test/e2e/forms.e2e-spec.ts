/**
 * Forms & Submissions E2E Tests
 *
 * PRIORITY 2: Tests form creation, submission, and multi-tenant isolation
 * Ensures businesses can only access their own forms and submissions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  createTestUser,
  createTestBusiness,
  createTestCampaign,
  createTestForm,
  cleanupTestData,
} from '../utils/test-helpers';

describe('Forms (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let user1: any;
  let business1: any;
  let user1Token: string;
  let campaign1: any;

  let user2: any;
  let business2: any;
  let user2Token: string;
  let campaign2: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Setup test data
    user1 = await createTestUser(prisma, { email: 'form1@test.com' });
    business1 = await createTestBusiness(prisma, user1.id, {
      businessName: 'Restaurant with Forms',
    });
    user1Token = jwtService.sign({
      sub: user1.id,
      email: user1.email,
      businessId: business1.id,
    });
    campaign1 = await createTestCampaign(prisma, business1.id, {
      name: 'Feedback Campaign',
    });

    user2 = await createTestUser(prisma, { email: 'form2@test.com' });
    business2 = await createTestBusiness(prisma, user2.id, {
      businessName: 'Another Restaurant',
    });
    user2Token = jwtService.sign({
      sub: user2.id,
      email: user2.email,
      businessId: business2.id,
    });
    campaign2 = await createTestCampaign(prisma, business2.id, {
      name: 'Business 2 Campaign',
    });
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
    await app.close();
  });

  describe('POST /api/forms - Create Form', () => {
    it('should create form with required fields', async () => {
      const createDto = {
        campaignId: campaign1.id,
        title: 'Customer Feedback Form',
        description: 'We value your feedback',
        fields: [
          {
            label: 'Name',
            type: 'text',
            required: true,
            placeholder: 'Enter your name',
          },
          {
            label: 'Email',
            type: 'email',
            required: true,
            placeholder: 'Enter your email',
          },
          {
            label: 'Rating',
            type: 'number',
            required: true,
            min: 1,
            max: 5,
          },
          {
            label: 'Comments',
            type: 'textarea',
            required: false,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/forms')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        campaignId: campaign1.id,
        businessId: business1.id,
        title: createDto.title,
        description: createDto.description,
        isActive: true,
        submitButtonText: 'Submit', // Default value
        successMessage: 'Thank you! Your response has been recorded.', // Default
      });

      expect(response.body.fields).toEqual(createDto.fields);
      expect(response.body.campaign).toBeDefined();
      expect(response.body.campaign.id).toBe(campaign1.id);
    });

    it('should create form with custom submit button and success message', async () => {
      const otherCampaign = await createTestCampaign(prisma, business1.id, {
        name: 'Another Campaign',
      });

      const createDto = {
        campaignId: otherCampaign.id,
        title: 'Contact Form',
        fields: [{ label: 'Name', type: 'text', required: true }],
        submitButtonText: 'Send Message',
        successMessage: 'Thank you! We will contact you soon.',
        redirectUrl: 'https://example.com/thank-you',
      };

      const response = await request(app.getHttpServer())
        .post('/api/forms')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.submitButtonText).toBe('Send Message');
      expect(response.body.successMessage).toBe(
        'Thank you! We will contact you soon.',
      );
      expect(response.body.redirectUrl).toBe('https://example.com/thank-you');
    });

    it('should reject form creation for non-existent campaign', async () => {
      const createDto = {
        campaignId: '00000000-0000-0000-0000-000000000000',
        title: 'Test Form',
        fields: [{ label: 'Name', type: 'text', required: true }],
      };

      await request(app.getHttpServer())
        .post('/api/forms')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should reject form creation for other business campaign', async () => {
      // User1 tries to create form for User2's campaign
      const createDto = {
        campaignId: campaign2.id, // Belongs to business2
        title: 'Unauthorized Form',
        fields: [{ label: 'Name', type: 'text', required: true }],
      };

      await request(app.getHttpServer())
        .post('/api/forms')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should reject duplicate form for same campaign', async () => {
      const duplicateCampaign = await createTestCampaign(prisma, business1.id, {
        name: 'Duplicate Test Campaign',
      });

      // Create first form
      await createTestForm(prisma, duplicateCampaign.id, {
        title: 'First Form',
      });

      // Try to create second form for same campaign
      const createDto = {
        campaignId: duplicateCampaign.id,
        title: 'Second Form',
        fields: [{ label: 'Name', type: 'text', required: true }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/forms')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('already has a form');
    });

    it('should require authentication', async () => {
      const createDto = {
        campaignId: campaign1.id,
        title: 'Test Form',
        fields: [{ label: 'Name', type: 'text', required: true }],
      };

      await request(app.getHttpServer())
        .post('/api/forms')
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/forms - List Forms', () => {
    let form1: any;
    let form2: any;

    beforeAll(async () => {
      const c1 = await createTestCampaign(prisma, business1.id, {
        name: 'Campaign with Form 1',
      });
      const c2 = await createTestCampaign(prisma, business1.id, {
        name: 'Campaign with Form 2',
      });

      form1 = await createTestForm(prisma, c1.id, {
        title: 'Form 1',
        isActive: true,
      });

      form2 = await createTestForm(prisma, c2.id, {
        title: 'Form 2',
        isActive: false,
      });
    });

    it('should list all forms for business', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/forms')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      const formTitles = response.body.data.map((f: any) => f.title);
      expect(formTitles).toContain('Form 1');
      expect(formTitles).toContain('Form 2');

      // Should include campaign info and submission count
      const firstForm = response.body.data[0];
      expect(firstForm.campaign).toBeDefined();
      expect(firstForm._count.submissions).toBeDefined();
    });

    it('should filter forms by campaign', async () => {
      const campaignId = form1.campaignId;

      const response = await request(app.getHttpServer())
        .get(`/api/forms?campaignId=${campaignId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].campaignId).toBe(campaignId);
    });

    it('should filter forms by isActive status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/forms?isActive=true')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(
        response.body.data.every((f: any) => f.isActive === true),
      ).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/forms?page=1&limit=1')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(1);
      expect(response.body.meta.total).toBeGreaterThanOrEqual(2);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should enforce multi-tenant isolation', async () => {
      // Business 1 forms
      const response1 = await request(app.getHttpServer())
        .get('/api/forms')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      // Business 2 forms
      const response2 = await request(app.getHttpServer())
        .get('/api/forms')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(HttpStatus.OK);

      const business1FormIds = response1.body.data.map((f: any) => f.id);
      const business2FormIds = response2.body.data.map((f: any) => f.id);

      // No overlap
      const intersection = business1FormIds.filter((id: string) =>
        business2FormIds.includes(id),
      );
      expect(intersection).toHaveLength(0);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/forms')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/forms/:id - Get Form Details', () => {
    let testForm: any;

    beforeAll(async () => {
      const c = await createTestCampaign(prisma, business1.id, {
        name: 'Form Details Campaign',
      });
      testForm = await createTestForm(prisma, c.id, {
        title: 'Detailed Form',
      });
    });

    it('should get form by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/forms/${testForm.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(testForm.id);
      expect(response.body.title).toBe('Detailed Form');
      expect(response.body.campaign).toBeDefined();
      expect(response.body._count.submissions).toBeDefined();
    });

    it('should return 404 for non-existent form', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/forms/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for other business form', async () => {
      const c2 = await createTestCampaign(prisma, business2.id, {
        name: 'Business 2 Form Campaign',
      });
      const business2Form = await createTestForm(prisma, c2.id, {
        title: 'Business 2 Form',
      });

      // Business 1 tries to access Business 2's form
      await request(app.getHttpServer())
        .get(`/api/forms/${business2Form.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/forms/${testForm.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/forms/campaign/:campaignId - Get Public Form', () => {
    let publicCampaign: any;
    let publicForm: any;

    beforeAll(async () => {
      publicCampaign = await createTestCampaign(prisma, business1.id, {
        name: 'Public Form Campaign',
      });
      publicForm = await createTestForm(prisma, publicCampaign.id, {
        title: 'Public Feedback Form',
        isActive: true,
      });
    });

    it('should get active form by campaign ID without auth', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/forms/campaign/${publicCampaign.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: publicForm.id,
        title: 'Public Feedback Form',
      });

      // Should only return public fields (no businessId, etc.)
      expect(response.body.businessId).toBeUndefined();
      expect(response.body.createdAt).toBeUndefined();
    });

    it('should return 404 for campaign with inactive form', async () => {
      const inactiveCampaign = await createTestCampaign(prisma, business1.id, {
        name: 'Inactive Form Campaign',
      });
      await createTestForm(prisma, inactiveCampaign.id, {
        title: 'Inactive Form',
        isActive: false,
      });

      await request(app.getHttpServer())
        .get(`/api/forms/campaign/${inactiveCampaign.id}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for campaign without form', async () => {
      const noFormCampaign = await createTestCampaign(prisma, business1.id, {
        name: 'No Form Campaign',
      });

      await request(app.getHttpServer())
        .get(`/api/forms/campaign/${noFormCampaign.id}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /api/forms/:id - Update Form', () => {
    let updateForm: any;

    beforeEach(async () => {
      const c = await createTestCampaign(prisma, business1.id, {
        name: 'Update Form Campaign',
      });
      updateForm = await createTestForm(prisma, c.id, {
        title: 'Original Title',
        description: 'Original Description',
      });
    });

    it('should update form fields', async () => {
      const updateDto = {
        title: 'Updated Title',
        description: 'Updated Description',
        submitButtonText: 'Send',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/forms/${updateForm.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject(updateDto);
    });

    it('should update form active status', async () => {
      const updateDto = { isActive: false };

      const response = await request(app.getHttpServer())
        .patch(`/api/forms/${updateForm.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.isActive).toBe(false);
    });

    it('should update form fields array', async () => {
      const updateDto = {
        fields: [
          { label: 'New Field 1', type: 'text', required: true },
          { label: 'New Field 2', type: 'email', required: false },
        ],
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/forms/${updateForm.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.fields).toEqual(updateDto.fields);
    });

    it('should return 404 for non-existent form', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .patch(`/api/forms/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Updated' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 when updating other business form', async () => {
      const c2 = await createTestCampaign(prisma, business2.id, {
        name: 'Business 2 Campaign',
      });
      const business2Form = await createTestForm(prisma, c2.id, {
        title: 'Business 2 Form',
      });

      await request(app.getHttpServer())
        .patch(`/api/forms/${business2Form.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Hacked!' })
        .expect(HttpStatus.NOT_FOUND);

      // Verify not updated
      const unchanged = await prisma.form.findUnique({
        where: { id: business2Form.id },
      });
      expect(unchanged.title).toBe('Business 2 Form');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/api/forms/${updateForm.id}`)
        .send({ title: 'Updated' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /api/forms/:id - Delete Form', () => {
    let deleteForm: any;

    beforeEach(async () => {
      const c = await createTestCampaign(prisma, business1.id, {
        name: 'Delete Form Campaign',
      });
      deleteForm = await createTestForm(prisma, c.id, {
        title: 'Form to Delete',
      });
    });

    it('should hard delete form', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/forms/${deleteForm.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body.message).toContain('deleted successfully');

      // Verify form is deleted
      const deleted = await prisma.form.findUnique({
        where: { id: deleteForm.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent form', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .delete(`/api/forms/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 when deleting other business form', async () => {
      const c2 = await createTestCampaign(prisma, business2.id, {
        name: 'Business 2 Campaign',
      });
      const business2Form = await createTestForm(prisma, c2.id, {
        title: 'Business 2 Form',
      });

      await request(app.getHttpServer())
        .delete(`/api/forms/${business2Form.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);

      // Verify not deleted
      const exists = await prisma.form.findUnique({
        where: { id: business2Form.id },
      });
      expect(exists).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/forms/${deleteForm.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/forms/:id/submit - Submit Form (Public)', () => {
    let submitForm: any;

    beforeAll(async () => {
      const c = await createTestCampaign(prisma, business1.id, {
        name: 'Submission Campaign',
      });
      submitForm = await createTestForm(prisma, c.id, {
        title: 'Customer Feedback',
        fields: [
          { label: 'Name', type: 'text', required: true },
          { label: 'Email', type: 'email', required: true },
          { label: 'Phone', type: 'tel', required: false },
          { label: 'Rating', type: 'number', required: true },
          { label: 'Comments', type: 'textarea', required: false },
        ],
        successMessage: 'Thank you for your feedback!',
        redirectUrl: 'https://example.com/thank-you',
      });
    });

    it('should submit form with all required fields', async () => {
      const submitDto = {
        data: {
          Name: 'John Doe',
          Email: 'john@example.com',
          Phone: '+919876543210',
          Rating: 5,
          Comments: 'Great service!',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/forms/${submitForm.id}/submit`)
        .send(submitDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Thank you for your feedback!',
        redirectUrl: 'https://example.com/thank-you',
      });
      expect(response.body.submissionId).toBeDefined();

      // Verify submission was created
      const submission = await prisma.formSubmission.findUnique({
        where: { id: response.body.submissionId },
      });
      expect(submission).toBeDefined();
      expect(submission.data).toMatchObject(submitDto.data);
    });

    it('should create or update customer from submission', async () => {
      const submitDto = {
        data: {
          Name: 'Jane Smith',
          Email: 'jane@example.com',
          Phone: '+911234567890',
          Rating: 4,
        },
      };

      await request(app.getHttpServer())
        .post(`/api/forms/${submitForm.id}/submit`)
        .send(submitDto)
        .expect(HttpStatus.CREATED);

      // Verify customer was created
      const customer = await prisma.customer.findFirst({
        where: {
          businessId: business1.id,
          email: 'jane@example.com',
        },
      });

      expect(customer).toBeDefined();
      expect(customer.name).toBe('Jane Smith');
      expect(customer.phone).toBe('+911234567890');
      expect(customer.source).toBe('FORM');
    });

    it('should capture IP address and geo data', async () => {
      const submitDto = {
        data: {
          Name: 'Test User',
          Email: 'test@example.com',
          Rating: 5,
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/forms/${submitForm.id}/submit`)
        .send(submitDto)
        .expect(HttpStatus.CREATED);

      const submission = await prisma.formSubmission.findUnique({
        where: { id: response.body.submissionId },
      });

      expect(submission.ipAddress).toBeDefined();
      expect(submission.userAgent).toBeDefined();
      expect(submission.geoCountry).toBeDefined();
    });

    it('should reject submission with missing required fields', async () => {
      const invalidDto = {
        data: {
          Name: 'John Doe',
          // Missing Email (required)
          Rating: 5,
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/forms/${submitForm.id}/submit`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('Email');
      expect(response.body.message).toContain('required');
    });

    it('should reject submission to inactive form', async () => {
      const inactiveCampaign = await createTestCampaign(prisma, business1.id, {
        name: 'Inactive Submission Campaign',
      });
      const inactiveForm = await createTestForm(prisma, inactiveCampaign.id, {
        title: 'Inactive Form',
        isActive: false,
        fields: [{ label: 'Name', type: 'text', required: true }],
      });

      const submitDto = {
        data: { Name: 'Test' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/forms/${inactiveForm.id}/submit`)
        .send(submitDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('not accepting submissions');
    });

    it('should work without authentication (public endpoint)', async () => {
      const submitDto = {
        data: {
          Name: 'Anonymous User',
          Email: 'anon@example.com',
          Rating: 3,
        },
      };

      // No auth token provided - should still work
      await request(app.getHttpServer())
        .post(`/api/forms/${submitForm.id}/submit`)
        .send(submitDto)
        .expect(HttpStatus.CREATED);
    });

    it('should return 404 for non-existent form', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/api/forms/${fakeId}/submit`)
        .send({ data: { Name: 'Test' } })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /api/forms/:id/submissions - Get Submissions', () => {
    let submissionForm: any;
    let submissionId1: string;
    let submissionId2: string;

    beforeAll(async () => {
      const c = await createTestCampaign(prisma, business1.id, {
        name: 'Submissions Campaign',
      });
      submissionForm = await createTestForm(prisma, c.id, {
        title: 'Submission Test Form',
        fields: [
          { label: 'Name', type: 'text', required: true },
          { label: 'Email', type: 'email', required: true },
        ],
      });

      // Create test submissions
      const sub1 = await prisma.formSubmission.create({
        data: {
          formId: submissionForm.id,
          campaignId: c.id,
          businessId: business1.id,
          data: { Name: 'User 1', Email: 'user1@example.com' },
          ipAddress: '127.0.0.1',
          geoCountry: 'IN',
        },
      });

      const sub2 = await prisma.formSubmission.create({
        data: {
          formId: submissionForm.id,
          campaignId: c.id,
          businessId: business1.id,
          data: { Name: 'User 2', Email: 'user2@example.com' },
          ipAddress: '127.0.0.1',
          geoCountry: 'IN',
        },
      });

      submissionId1 = sub1.id;
      submissionId2 = sub2.id;
    });

    it('should get all submissions for form', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/forms/${submissionForm.id}/submissions`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Should include submission data
      const submission = response.body.data[0];
      expect(submission.data).toBeDefined();
      expect(submission.submittedAt).toBeDefined();
      expect(submission.ipAddress).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/forms/${submissionForm.id}/submissions?page=1&limit=1`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(1);
      expect(response.body.data.length).toBe(1);
    });

    it('should return 404 for other business form submissions', async () => {
      const c2 = await createTestCampaign(prisma, business2.id, {
        name: 'Business 2 Campaign',
      });
      const business2Form = await createTestForm(prisma, c2.id, {
        title: 'Business 2 Form',
        fields: [{ label: 'Name', type: 'text', required: true }],
      });

      // Business 1 tries to access Business 2's submissions
      await request(app.getHttpServer())
        .get(`/api/forms/${business2Form.id}/submissions`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/forms/${submissionForm.id}/submissions`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});

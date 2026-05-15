-- Seed Data for Customer Complaint & Resolution Tracking System

-- Insert Roles
INSERT INTO roles (role_id, role_name, description) VALUES
  ('11111111-1111-1111-1111-111111111001', 'Admin', 'Full system access'),
  ('11111111-1111-1111-1111-111111111002', 'Supervisor', 'Monitor and manage complaint queues'),
  ('11111111-1111-1111-1111-111111111003', 'Support Agent', 'Handle and resolve complaints'),
  ('11111111-1111-1111-1111-111111111004', 'Customer', 'Register and track complaints'),
  ('11111111-1111-1111-1111-111111111005', 'Quality Team', 'Analyze complaint trends');

-- Insert Users (passwords are all: Password@123)
-- bcrypt hash of 'Password@123'
INSERT INTO users (user_id, name, email, password, phone, role_id) VALUES
  ('22222222-2222-2222-2222-222222222001', 'System Admin', 'admin@company.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1-555-0100',
   '11111111-1111-1111-1111-111111111001'),
  ('22222222-2222-2222-2222-222222222002', 'Sarah Johnson', 'supervisor@company.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1-555-0101',
   '11111111-1111-1111-1111-111111111002'),
  ('22222222-2222-2222-2222-222222222003', 'Michael Chen', 'agent1@company.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1-555-0102',
   '11111111-1111-1111-1111-111111111003'),
  ('22222222-2222-2222-2222-222222222004', 'Emily Davis', 'agent2@company.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1-555-0103',
   '11111111-1111-1111-1111-111111111003'),
  ('22222222-2222-2222-2222-222222222005', 'John Smith', 'customer1@example.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1-555-0104',
   '11111111-1111-1111-1111-111111111004'),
  ('22222222-2222-2222-2222-222222222006', 'Alice Brown', 'customer2@example.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1-555-0105',
   '11111111-1111-1111-1111-111111111004'),
  ('22222222-2222-2222-2222-222222222007', 'Quality Analyst', 'quality@company.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1-555-0106',
   '11111111-1111-1111-1111-111111111005');

-- Insert Categories
INSERT INTO categories (category_id, category_name, description) VALUES
  ('33333333-3333-3333-3333-333333333001', 'Billing Issues', 'Issues related to invoices, charges, and payments'),
  ('33333333-3333-3333-3333-333333333002', 'Service Disruption', 'Service outages or degraded performance'),
  ('33333333-3333-3333-3333-333333333003', 'Product Defects', 'Defective or damaged products'),
  ('33333333-3333-3333-3333-333333333004', 'Technical Problems', 'Software or hardware technical issues'),
  ('33333333-3333-3333-3333-333333333005', 'Delivery Delays', 'Delayed shipments or deliveries'),
  ('33333333-3333-3333-3333-333333333006', 'Account Issues', 'Account access, login, or profile problems'),
  ('33333333-3333-3333-3333-333333333007', 'Customer Service', 'Complaints about customer service quality');

-- Insert Sample Complaints
INSERT INTO complaints (complaint_id, complaint_number, customer_id, category_id, assigned_agent_id, subject, description, priority, status, sla_deadline, resolved_at) VALUES
  ('44444444-4444-4444-4444-444444444001', 'CMP-20260514-1001',
   '22222222-2222-2222-2222-222222222005', '33333333-3333-3333-3333-333333333001',
   '22222222-2222-2222-2222-222222222003',
   'Double charged for subscription', 'I was charged twice for my monthly subscription this month. The charges appeared on my credit card on May 1st and May 3rd.',
   'High', 'In Progress', NOW() + INTERVAL '5 hours', NULL),

  ('44444444-4444-4444-4444-444444444002', 'CMP-20260514-1002',
   '22222222-2222-2222-2222-222222222006', '33333333-3333-3333-3333-333333333002',
   '22222222-2222-2222-2222-222222222004',
   'Internet service down since morning', 'My internet service has been completely down since 8 AM today. I have tried restarting the router multiple times but the issue persists.',
   'Critical', 'Escalated', NOW() - INTERVAL '2 hours', NULL),

  ('44444444-4444-4444-4444-444444444003', 'CMP-20260514-1003',
   '22222222-2222-2222-2222-222222222005', '33333333-3333-3333-3333-333333333005',
   NULL,
   'Order not delivered after 2 weeks', 'I placed an order two weeks ago (Order #ORD-789) and it still has not been delivered. The tracking shows it has been at the warehouse for 10 days.',
   'Medium', 'Open', NOW() + INTERVAL '24 hours', NULL),

  ('44444444-4444-4444-4444-444444444004', 'CMP-20260514-1004',
   '22222222-2222-2222-2222-222222222006', '33333333-3333-3333-3333-333333333004',
   '22222222-2222-2222-2222-222222222003',
   'App crashes on login', 'The mobile application crashes every time I try to log in. I have tried reinstalling the app but the issue continues.',
   'High', 'Resolved', NOW() + INTERVAL '20 hours', NOW() - INTERVAL '30 minutes'),

  ('44444444-4444-4444-4444-444444444005', 'CMP-20260514-1005',
   '22222222-2222-2222-2222-222222222005', '33333333-3333-3333-3333-333333333006',
   '22222222-2222-2222-2222-222222222004',
   'Cannot reset my account password', 'I am not receiving the password reset email. I have checked my spam folder and it is not there either.',
   'Low', 'Resolved', NOW() + INTERVAL '60 hours', NOW() - INTERVAL '2 hours');

-- Insert Complaint History
INSERT INTO complaint_history (complaint_id, updated_by, old_status, new_status, comment) VALUES
  ('44444444-4444-4444-4444-444444444001', '22222222-2222-2222-2222-222222222005', NULL, 'Open', 'Complaint registered.'),
  ('44444444-4444-4444-4444-444444444001', '22222222-2222-2222-2222-222222222002', 'Open', 'Assigned', 'Assigned to Michael Chen for investigation.'),
  ('44444444-4444-4444-4444-444444444001', '22222222-2222-2222-2222-222222222003', 'Assigned', 'In Progress', 'Investigating the duplicate charge with the billing team.'),
  ('44444444-4444-4444-4444-444444444002', '22222222-2222-2222-2222-222222222006', NULL, 'Open', 'Complaint registered.'),
  ('44444444-4444-4444-4444-444444444002', '22222222-2222-2222-2222-222222222002', 'Open', 'Assigned', 'Assigned to Emily Davis.'),
  ('44444444-4444-4444-4444-444444444002', '22222222-2222-2222-2222-222222222004', 'Assigned', 'Escalated', 'Critical service outage escalated to supervisor.'),
  ('44444444-4444-4444-4444-444444444003', '22222222-2222-2222-2222-222222222005', NULL, 'Open', 'Complaint registered.'),
  ('44444444-4444-4444-4444-444444444004', '22222222-2222-2222-2222-222222222006', NULL, 'Open', 'Complaint registered.'),
  ('44444444-4444-4444-4444-444444444004', '22222222-2222-2222-2222-222222222002', 'Open', 'Assigned', 'Assigned to Michael Chen.'),
  ('44444444-4444-4444-4444-444444444004', '22222222-2222-2222-2222-222222222003', 'Assigned', 'In Progress', 'Reproducing the issue in testing environment.'),
  ('44444444-4444-4444-4444-444444444004', '22222222-2222-2222-2222-222222222003', 'In Progress', 'Resolved', 'Fixed authentication bug in version 2.1.5. App update deployed.'),
  ('44444444-4444-4444-4444-444444444005', '22222222-2222-2222-2222-222222222005', NULL, 'Open', 'Complaint registered.'),
  ('44444444-4444-4444-4444-444444444005', '22222222-2222-2222-2222-222222222004', 'Open', 'Resolved', 'Fixed email delivery configuration. Reset email sent successfully.');

-- Insert Sample Feedback
INSERT INTO feedback (complaint_id, customer_id, rating, comments) VALUES
  ('44444444-4444-4444-4444-444444444004', '22222222-2222-2222-2222-222222222006', 5, 'Excellent support! Issue was resolved quickly and the agent was very helpful.'),
  ('44444444-4444-4444-4444-444444444005', '22222222-2222-2222-2222-222222222005', 4, 'Good resolution. Took a bit longer than expected but the agent was responsive.');

-- Update complaint status to Closed after feedback
UPDATE complaints SET status = 'Closed', closed_at = NOW() WHERE complaint_id IN (
  '44444444-4444-4444-4444-444444444004',
  '44444444-4444-4444-4444-444444444005'
);

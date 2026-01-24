# Implementation Plan: Private Channels with Invitations

## Overview

This implementation plan converts the private channels design into a series of incremental coding tasks. Each task builds on previous work and focuses on discrete, testable functionality within the existing chat module architecture. The plan integrates seamlessly with the existing FastAPI backend and React frontend, extending current models and components rather than creating separate modules.

## Tasks

- [ ] 1. Database Schema Updates and Migrations
  - Create Alembic migrations for Channel, ChannelMember, and Message model enhancements
  - Add visibility field to channels table with public/private enum
  - Add role field to channel_members table with owner/admin/moderator/member enum
  - Add message_type and invitation_id fields to messages table
  - Create channel_invitations table with all required fields and constraints
  - Create appropriate database indexes for performance
  - Update existing data: set channels to public, assign owner roles to creators
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ]* 1.1 Write property test for database schema constraints
  - **Property 1: Channel visibility constraint validation**
  - **Validates: Requirements 9.1**

- [ ] 2. Enhanced Backend Models and Core Services
  - [ ] 2.1 Update Channel model with visibility field and validation
    - Add visibility field with proper SQLAlchemy mapping
    - Add validation for visibility enum values
    - Update existing relationships and methods
    - _Requirements: 1.2, 9.1_

  - [ ] 2.2 Update ChannelMember model with role field and validation
    - Add role field with proper SQLAlchemy mapping
    - Add validation for role enum values
    - Update unique constraints and indexes
    - _Requirements: 2.1, 2.2, 9.2_

  - [ ] 2.3 Update Message model for invitation message support
    - Add message_type field with enum validation
    - Add invitation_id foreign key relationship
    - Update existing message creation logic
    - _Requirements: 5.1, 5.4_

  - [ ] 2.4 Create ChannelInvitation model with full validation
    - Implement complete model with all required fields
    - Add proper relationships to Channel, User, and Message models
    - Implement token generation and expiration logic
    - Add unique constraints for email-channel combinations
    - _Requirements: 3.1, 3.2, 3.4, 10.6_

  - [ ]* 2.5 Write property tests for model validation
    - **Property 2: Channel Creator Ownership**
    - **Property 4: Invitation Creation Completeness**
    - **Validates: Requirements 2.1, 3.1, 3.2**

- [ ] 3. Enhanced Channel Service with Visibility Control
  - [ ] 3.1 Implement channel visibility filtering logic
    - Update get_user_channels to filter by visibility and membership
    - Implement can_user_access_channel permission checking
    - Add role-based permission validation methods
    - _Requirements: 1.2, 1.3, 1.4, 2.3, 2.4, 2.5, 2.6_

  - [ ] 3.2 Enhance channel creation with role assignment
    - Update create_channel to support visibility setting
    - Automatically assign owner role to channel creator
    - Validate visibility and role parameters
    - _Requirements: 2.1, 9.4, 9.5_

  - [ ]* 3.3 Write property tests for visibility control
    - **Property 1: Private Channel Visibility Control**
    - **Property 3: Role-Based Permission Enforcement**
    - **Validates: Requirements 1.2, 1.4, 2.3, 2.4, 2.5, 2.6**

- [ ] 4. Invitation Service Implementation
  - [ ] 4.1 Create core invitation management service
    - Implement create_invitation with email and DM delivery
    - Add invitation validation and duplicate prevention
    - Implement accept/decline invitation logic
    - Add invitation expiration and cleanup handling
    - _Requirements: 3.1, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4, 6.6, 10.3, 10.4_

  - [ ] 4.2 Implement dual notification system (email + DM)
    - Integrate with existing EmailAccount system for email delivery
    - Create invitation direct messages for existing users
    - Add proper error handling for notification failures
    - Implement notification content with required details
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.5_

  - [ ] 4.3 Add invitation response handling from direct messages
    - Implement accept_invitation_from_dm method
    - Update invitation message status after response
    - Send welcome messages to channels after acceptance
    - Handle WebSocket notifications for all parties
    - _Requirements: 5.2, 6.1, 6.2, 6.3_

  - [ ]* 4.4 Write property tests for invitation workflow
    - **Property 5: Invitation Uniqueness Constraint**
    - **Property 6: Dual Channel Invitation Delivery**
    - **Property 8: Invitation Response Processing**
    - **Validates: Requirements 3.4, 4.1, 4.2, 5.1, 6.1, 6.2, 6.3, 6.6**

- [ ] 5. Enhanced API Endpoints in Chat Router
  - [ ] 5.1 Add invitation management endpoints to chat router
    - POST /channels/{id}/invitations for creating invitations
    - GET /invitations/pending for user's pending invitations
    - GET /channels/{id}/invitations for channel owner invitation list
    - Add proper authentication and authorization validation
    - _Requirements: 8.1, 8.2, 8.3, 8.7, 10.2_

  - [ ] 5.2 Add invitation response endpoints
    - POST /invitations/{id}/accept for accepting invitations
    - POST /invitations/{id}/accept-from-dm for DM-based acceptance
    - POST /invitations/{id}/decline for declining invitations
    - DELETE /channels/{id}/invitations/{id} for canceling invitations
    - _Requirements: 8.4, 8.5, 8.6_

  - [ ] 5.3 Enhance existing channel endpoints for visibility
    - Update POST /channels to support visibility parameter
    - Update GET /channels to filter by visibility and membership
    - Add user role information to channel responses
    - Ensure backward compatibility with existing clients
    - _Requirements: 1.1, 1.2, 7.1_

  - [ ]* 5.4 Write unit tests for API endpoints
    - Test all endpoint authentication and authorization
    - Test error handling for invalid requests
    - Test proper HTTP status code responses
    - _Requirements: 8.7, 10.2_

- [ ] 6. Checkpoint - Backend Core Functionality Complete
  - Ensure all backend services are working correctly
  - Verify database migrations run successfully
  - Test invitation creation and response workflows
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Enhanced Pydantic Schemas
  - [ ] 7.1 Create enhanced channel schemas with visibility
    - Update ChannelBase to include visibility field
    - Create ChannelCreateWithVisibility schema
    - Enhance ChannelResponse with user role information
    - Add proper validation for visibility and role enums
    - _Requirements: 1.1, 2.2_

  - [ ] 7.2 Create invitation schemas for API responses
    - Implement InvitationBase, InvitationCreate, InvitationResponse
    - Add nested channel and user information for UI display
    - Include proper email validation and role constraints
    - _Requirements: 3.3, 3.5_

  - [ ] 7.3 Enhance message schemas for invitation messages
    - Update MessageBase to include message_type and invitation_id
    - Create MessageWithInvitation schema for invitation messages
    - Enhance existing MessageWithUser schema
    - _Requirements: 5.1, 5.4_

  - [ ]* 7.4 Write unit tests for schema validation
    - Test email format validation
    - Test enum constraint validation
    - Test required field validation
    - _Requirements: 3.3, 10.1_

- [ ] 8. Frontend: Enhanced Channel Header and Invite Modal
  - [ ] 8.1 Update ChannelHeader component with invite functionality
    - Add lock icon display for private channels
    - Add "Invite" button for channel owners of private channels
    - Integrate embedded InviteModal component
    - Ensure proper role-based UI visibility
    - _Requirements: 1.5, 7.3, 7.4_

  - [ ] 8.2 Create embedded InviteModal component
    - Build modal with email input and role selection
    - Add option for sending direct message to existing users
    - Implement form validation and error handling
    - Connect to invitation creation API endpoint
    - _Requirements: 7.4, 3.5_

  - [ ]* 8.3 Write unit tests for channel header and invite modal
    - Test conditional rendering based on user role
    - Test form validation and submission
    - Test error handling and user feedback
    - _Requirements: 1.5, 7.3_

- [ ] 9. Frontend: Enhanced Message Components for Invitations
  - [ ] 9.1 Update Message component to handle invitation messages
    - Add support for different message types
    - Create InvitationMessage sub-component
    - Implement accept/decline buttons for invitation recipients
    - Add proper styling and visual distinction
    - _Requirements: 5.4, 7.7_

  - [ ] 9.2 Implement invitation message interaction logic
    - Connect accept/decline buttons to API endpoints
    - Handle both email-based and DM-based invitation responses
    - Update message display after response (accepted/declined status)
    - Add proper loading states and error handling
    - _Requirements: 6.1, 6.2, 6.3, 5.2_

  - [ ]* 9.3 Write unit tests for invitation message components
    - Test conditional rendering for different invitation states
    - Test user interaction with accept/decline buttons
    - Test proper API integration and error handling
    - _Requirements: 5.4, 6.1, 6.2, 6.3_

- [ ] 10. Frontend: Enhanced Channel List and Creation
  - [ ] 10.1 Update ChannelList component with private channel indicators
    - Add lock icons for private channels
    - Filter channels based on user membership and visibility
    - Ensure proper visual distinction between public and private
    - _Requirements: 1.5, 7.2_

  - [ ] 10.2 Update CreateChannelModal with visibility toggle
    - Add visibility selection (public/private) to channel creation form
    - Update form validation and submission logic
    - Connect to enhanced channel creation API
    - _Requirements: 1.1, 7.1_

  - [ ]* 10.3 Write unit tests for channel list and creation
    - Test private channel filtering and display
    - Test channel creation with visibility options
    - Test proper API integration
    - _Requirements: 1.1, 1.5_

- [ ] 11. Frontend: Channel Settings and Invitation Management
  - [ ] 11.1 Add invitation management to ChannelSettings component
    - Display pending invitations list for channel owners
    - Add cancel invitation functionality
    - Show invitation status and expiration information
    - Implement proper permission-based UI visibility
    - _Requirements: 3.6, 7.6_

  - [ ] 11.2 Create InvitationItem component for invitation display
    - Show invitation details (email, role, status, expiration)
    - Add cancel action for channel owners
    - Display proper status indicators
    - Handle real-time updates via WebSocket
    - _Requirements: 3.6, 5.2_

  - [ ]* 11.3 Write unit tests for invitation management UI
    - Test invitation list display and filtering
    - Test cancel invitation functionality
    - Test real-time updates and WebSocket integration
    - _Requirements: 3.6, 7.6_

- [ ] 12. WebSocket Integration and Real-time Updates
  - [ ] 12.1 Enhance WebSocket notifications for invitation events
    - Add invitation creation notifications to relevant users
    - Implement invitation response notifications to channel owners
    - Add real-time updates for invitation status changes
    - Integrate with existing WebSocket manager
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [ ] 12.2 Add real-time channel membership updates
    - Broadcast user join events when invitations are accepted
    - Update channel member lists in real-time
    - Send welcome messages to channels
    - Handle proper WebSocket connection management
    - _Requirements: 6.1, 5.2_

  - [ ]* 12.3 Write integration tests for WebSocket functionality
    - Test real-time notification delivery
    - Test proper event broadcasting to correct users
    - Test WebSocket connection handling and error recovery
    - _Requirements: 5.1, 5.2, 5.4_

- [ ] 13. Email Integration and Templates
  - [ ] 13.1 Create HTML email templates for invitations
    - Design invitation email template with channel information
    - Include accept/decline action links with proper tokens
    - Add expiration information and sender details
    - Ensure mobile-responsive email design
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 13.2 Integrate with existing EmailAccount system
    - Use existing email infrastructure for invitation delivery
    - Handle email delivery errors and retry logic
    - Add proper logging for email delivery status
    - Implement email delivery confirmation
    - _Requirements: 4.5_

  - [ ] 13.3 Add expiration notification emails
    - Send notification emails to channel owners when invitations expire
    - Include invitation details and suggested next actions
    - Implement automated cleanup of expired invitations
    - _Requirements: 4.4, 6.4_

  - [ ]* 13.4 Write unit tests for email integration
    - Test email template rendering with proper data
    - Test integration with EmailAccount system
    - Test error handling for email delivery failures
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 14. Security and Validation Enhancements
  - [ ] 14.1 Implement comprehensive input validation
    - Add email format validation for all invitation inputs
    - Validate role and visibility enum values
    - Implement proper sanitization for user inputs
    - Add rate limiting for invitation creation
    - _Requirements: 3.3, 10.1, 10.5_

  - [ ] 14.2 Enhance authentication and authorization
    - Validate user permissions for all invitation operations
    - Implement proper token-based invitation authentication
    - Add invitation token security and expiration validation
    - Ensure proper access control for private channels
    - _Requirements: 8.7, 10.2, 10.4, 10.6_

  - [ ]* 14.3 Write security tests
    - Test unauthorized access prevention
    - Test invitation token security
    - Test input validation and sanitization
    - _Requirements: 10.2, 10.4, 10.5, 10.6_

- [ ] 15. Final Integration and Testing
  - [ ] 15.1 Integration testing for complete invitation workflow
    - Test end-to-end invitation creation and acceptance
    - Verify dual notification delivery (email + DM)
    - Test real-time updates and WebSocket integration
    - Validate proper error handling throughout the flow
    - _Requirements: All requirements integration_

  - [ ] 15.2 Performance testing and optimization
    - Test database query performance with indexes
    - Validate WebSocket performance under load
    - Test email delivery performance and reliability
    - Optimize any identified bottlenecks
    - _Requirements: 9.6_

  - [ ]* 15.3 Write comprehensive property-based tests
    - **Property 9: Private Channel UI Indicators**
    - **Property 10: API Security and Validation**
    - **Property 11: Invitation Token Security**
    - **Property 12: Expiration Notification**
    - **Validates: Requirements 1.5, 7.3, 8.7, 10.6, 4.4**

- [ ] 16. Final Checkpoint - Complete System Verification
  - Ensure all features work correctly in both web and Electron versions
  - Verify backward compatibility with existing chat functionality
  - Test complete user workflows from invitation to channel participation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- Property tests validate universal correctness properties using Hypothesis (backend) and fast-check (frontend)
- Unit tests validate specific examples, edge cases, and integration points
- The implementation maintains full backward compatibility with existing chat functionality
- All new functionality is integrated into the existing `app/modules/chat/` structure
- Frontend components extend existing chat UI rather than creating separate interfaces
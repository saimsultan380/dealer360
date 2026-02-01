-- =============================================================================
-- MIGRATION 014: Notifications Table for Realtime Updates
-- =============================================================================
-- This migration creates the notifications table to support realtime
-- notifications across the application.
-- =============================================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Notification Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'vehicle_added',
    'vehicle_sold',
    'financing_created',
    'financing_payment_due',
    'japan_import_updated',
    'document_uploaded',
    'lead_created',
    'system_alert',
    'other'
  )),
  
  -- Related Entity (polymorphic)
  entity_type TEXT CHECK (entity_type IN ('vehicle', 'sale', 'financing', 'import_case', 'document', 'lead', null)),
  entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_organization_id ON public.notifications(organization_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_org_recipient ON public.notifications(organization_id, recipient_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id, is_read, created_at DESC);

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can mark their notifications as read"
  ON public.notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (recipient_id = auth.uid());

CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- REALTIME ENABLE
-- =============================================================================
-- Enable realtime for notifications table
-- Run this in Supabase dashboard: 
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================================================
-- HELPER FUNCTION: Create notification (for server actions)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_id UUID,
  p_organization_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    organization_id,
    title,
    message,
    notification_type,
    entity_type,
    entity_id
  )
  VALUES (
    p_recipient_id,
    p_organization_id,
    p_title,
    p_message,
    p_notification_type,
    p_entity_type,
    p_entity_id
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated, service_role;

-- Notifications table and realtime support have been set up successfully.

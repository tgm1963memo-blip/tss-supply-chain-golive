/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SalesPromotionsPage from '../../src/features/sales/SalesPromotionsPage.jsx';
import * as promotionService from '../../src/services/sales/promotionService.js';

// Mock the service
vi.mock('../../src/services/sales/promotionService.js');

describe('SalesPromotionsPage Safety & Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    promotionService.listPromotions.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the list view and safety banners', async () => {
    render(<SalesPromotionsPage />);
    
    // Safety banners must be present
    expect(screen.getByText('DATA ENTRY ONLY')).toBeInTheDocument();
    expect(screen.getByText('SAFE MODE')).toBeInTheDocument();
    expect(screen.getByText(/This page is for promotion data collection only/i)).toBeInTheDocument();
  });

  it('shows draft buttons and workflow section when creating new', async () => {
    render(<SalesPromotionsPage />);
    
    // Click New Promotion
    fireEvent.click(await screen.findByText('+ New Promotion'));
    
    expect(await screen.findByText('Save Draft')).toBeInTheDocument();
    
    // Submit for approval is NOT present if not saved yet (id is null)
    expect(screen.queryByText('Submit for Approval')).not.toBeInTheDocument();
    
    // No unsafe buttons exist
    expect(screen.queryByText(/write back/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/express/i, { selector: 'button' })).not.toBeInTheDocument();
    expect(screen.queryByText(/create so/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reserve stock/i)).not.toBeInTheDocument();
  });

  it('renders workflow buttons correctly for submitted status', async () => {
    promotionService.listPromotions.mockResolvedValue([
      { id: '1', promotion_no: 'P001', status: 'submitted' }
    ]);
    promotionService.listApprovalLogs.mockResolvedValue([]);

    render(<SalesPromotionsPage />);
    
    // Click View / Edit on the first item
    const viewButtons = await screen.findAllByText('View / Edit');
    fireEvent.click(viewButtons[0]);
    
    // Check buttons available for 'submitted'
    expect(await screen.findByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
    expect(screen.getByText('Request Revision')).toBeInTheDocument();
    
    // Draft / Submit buttons should not be present
    expect(screen.queryByText('Save Draft')).not.toBeInTheDocument();
    expect(screen.queryByText('Submit for Approval')).not.toBeInTheDocument();
  });

  it('renders workflow buttons correctly for draft status', async () => {
    promotionService.listPromotions.mockResolvedValue([
      { id: '2', promotion_no: 'P002', status: 'draft' }
    ]);
    promotionService.listApprovalLogs.mockResolvedValue([]);

    render(<SalesPromotionsPage />);
    
    const viewButtons = await screen.findAllByText('View / Edit');
    fireEvent.click(viewButtons[0]);
    
    // Draft can be submitted
    expect(await screen.findByText('Save Draft')).toBeInTheDocument();
    expect(screen.getByText('Submit for Approval')).toBeInTheDocument();
    
    // Should NOT have Approve/Reject
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });
});

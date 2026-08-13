export interface QualityInspection {
  id: string;
  reference_type: 'goods_receipt' | 'stock_count' | 'production_order';
  reference_id: string;
  item_id: string;
  variant_id: string | null;
  status: 'pending' | 'passed' | 'failed' | 'conditional';
  inspected_by: string | null;
  inspected_at: string | null;
  notes: string | null;
  warehouse_id: string | null;
  quantity_inspected: number | null;
  defect_count: number | null;
  created_at: string;
}

export interface QualityHold {
  id: string;
  warehouse_id: string;
  item_id: string;
  variant_id: string | null;
  quantity_held: number | null;
  status: 'active' | 'released' | 'rejected';
  reason: string | null;
  source_document_type: string | null;
  disposition: string | null;
  created_at: string;
  released_at: string | null;
}

export interface NonConformance {
  id: string;
  quality_inspection_id: string | null;
  item_id: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'investigating' | 'containment' | 'corrective_action' | 'verification' | 'closed';
  category: string | null;
  source: 'inspection' | 'customer_complaint' | 'manual';
  root_cause: string | null;
  created_at: string;
}

export interface CorrectiveAction {
  id: string;
  non_conformance_id: string;
  title: string;
  description: string | null;
  owner_id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string | null;
  status: 'assigned' | 'in_progress' | 'completed' | 'verified' | 'closed';
  created_at: string;
}

export interface SupplierQualityScore {
  supplier_id: string;
  supplier_name: string;
  total_inspections: number;
  passed_count: number;
  failed_count: number;
  pass_rate_percentage: number | null;
  failure_rate_percentage: number | null;
  ncr_count: number;
}

export interface InspectionSummary {
  total_inspections: number;
  pending: number;
  pass_rate_percentage: number | null;
  failure_rate_percentage: number | null;
  conditional_count: number;
}

export interface NcrTrends {
  total: number;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
}

export interface CapaPerformance {
  total_actions: number;
  closed_count: number;
  completion_rate_percentage: number | null;
  overdue_count: number;
}

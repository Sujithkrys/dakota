export const getStatusColor = (status: string) => {
  if (!status) return 'var(--text-muted)';
  
  switch (status.toLowerCase()) {
    case 'active':
    case 'sent':
    case 'completed':
    case 'delivered':
    case 'success':
    case 'on':
      return 'var(--accent-verdant)';
    case 'failed':
    case 'error':
    case 'inactive':
    case 'off':
      return 'var(--accent-danger)';
    case 'pending':
    case 'processing':
    case 'scanning':
    case 'draft':
      return 'var(--accent-warning)';
    case 'rating':
    case 'favourite':
    case 'favorite':
    case 'starred':
      return 'var(--accent-gold)';
    default:
      return 'var(--text-muted)';
  }
};

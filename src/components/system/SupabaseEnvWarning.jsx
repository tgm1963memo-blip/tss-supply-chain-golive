import Alert from '../scm-ui/Alert.jsx';
import { isSupabaseConfigured } from '../../lib/supabaseClient.js';

export default function SupabaseEnvWarning({ className = '' }) {
  if (isSupabaseConfigured()) {
    return null;
  }

  return (
    <Alert variant="warning" className={className}>
      Supabase is not configured — showing empty or seed preview data only. Set{' '}
      <code className="rounded bg-black/5 px-1">VITE_SUPABASE_URL</code> and{' '}
      <code className="rounded bg-black/5 px-1">VITE_SUPABASE_ANON_KEY</code> in{' '}
      <code className="rounded bg-black/5 px-1">.env.local</code>. See{' '}
      <code className="rounded bg-black/5 px-1">docs/09_SUPABASE_ENV_SETUP.md</code>.
    </Alert>
  );
}

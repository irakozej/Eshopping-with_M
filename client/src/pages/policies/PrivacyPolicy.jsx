import md from '../../../../policies/privacy-policy.md?raw';
import PolicyPage from './PolicyPage';

export default function PrivacyPolicy() {
  return <PolicyPage markdown={md} />;
}

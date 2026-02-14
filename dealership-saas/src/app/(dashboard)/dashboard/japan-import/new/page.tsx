'use client';

import { JapanImportCaseForm } from '@/components/japan-import/import-case-form';
import { JapanImportFormConfigProvider } from '@/components/japan-import/form-config';

export default function NewJapanImportCasePage() {
  return (
    <JapanImportFormConfigProvider>
      <JapanImportCaseForm mode="create" />
    </JapanImportFormConfigProvider>
  );
}


'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { PageHeader, Button } from '@ttaylor/ui';
import { Plus } from 'lucide-react';
import { TemplateList } from './TemplateList';
import { TemplateModal } from './TemplateModal';
import { TemplatePreviewModal } from './TemplatePreviewModal';

export type TemplateSummary = {
  id: string;
  name: string;
  code: string;
  category: string;
  templateEngine: string;
  version: number;
  activeFlag: boolean;
  content: string | null;
  matterTypeId: string | null;
  createdAt: string | Date;
};

type EditorState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; template: TemplateSummary };

export function TemplateManager() {
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? '';
  const canCreate = role === 'ATTORNEY' || role === 'ADMIN' || role === 'PARALEGAL';

  const [editorState, setEditorState] = useState<EditorState>({ mode: 'closed' });
  const [previewTemplate, setPreviewTemplate] = useState<TemplateSummary | null>(null);

  return (
    <>
      <PageHeader
        title="Templates"
        actions={
          canCreate ? (
            <Button variant="primary" onClick={() => setEditorState({ mode: 'create' })}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              New Template
            </Button>
          ) : undefined
        }
      />

      <TemplateList
        onEdit={(template) => setEditorState({ mode: 'edit', template })}
        onPreview={(template) => setPreviewTemplate(template)}
      />

      {editorState.mode !== 'closed' && (
        <TemplateModal
          mode={editorState.mode}
          template={editorState.mode === 'edit' ? editorState.template : null}
          onClose={() => setEditorState({ mode: 'closed' })}
        />
      )}

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </>
  );
}

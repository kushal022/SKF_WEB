import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, useToast } from '../../../components/ui';
import { formatDateTime } from '../../../utils/date';
import {
  useCreateEnquiryNoteMutation,
  useDeleteEnquiryNoteMutation,
} from '../../../app/store/api';
import type { EnquiryNote } from '../../../types/enquiry';

interface EnquiryNotesProps {
  enquiryPublicId: string;
  notes?: EnquiryNote[];
}

export function EnquiryNotes({ enquiryPublicId, notes = [] }: EnquiryNotesProps) {
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [createNote, { isLoading: isCreating }] = useCreateEnquiryNoteMutation();
  const [deleteNote, { isLoading: isDeleting }] = useDeleteEnquiryNoteMutation();

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = noteContent.trim();
    if (!trimmed) {
      setFormError('Note content cannot be empty.');
      return;
    }

    try {
      setFormError(null);
      await createNote({
        publicId: enquiryPublicId,
        data: { note: trimmed },
      }).unwrap();

      showToast('success', 'Internal note added successfully.', 'Note Created');
      setNoteContent('');
      setIsAdding(false);
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to save internal note.');
    }
  };

  const handleDeleteNote = async (notePublicId: string) => {
    if (!window.confirm('Are you sure you want to delete this internal note?')) {
      return;
    }

    try {
      await deleteNote({
        publicId: enquiryPublicId,
        notePublicId,
      }).unwrap();
      showToast('info', 'Internal note removed.', 'Note Deleted');
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to delete note.', 'Error');
    }
  };

  return (
    <Card className="shadow-xs border border-[var(--border-border)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--brand-accent)]" />
          <CardTitle className="text-base font-semibold">Internal Notes</CardTitle>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium">
            {notes.length}
          </span>
        </div>

        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAdding(true);
              setFormError(null);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Note
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {isAdding && (
          <form
            onSubmit={handleAddNote}
            className="p-4 rounded-xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/5 space-y-3 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                New Internal Note
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Private to team • Never shown to customer
              </span>
            </div>

            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Record details of customer calls, dimensions discussed, price commitments..."
              className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)] resize-y min-h-[80px]"
              autoFocus
            />

            {formError && (
              <p className="text-xs text-[var(--status-error)] font-medium">{formError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNoteContent('');
                  setFormError(null);
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isCreating}
              >
                Save Note
              </Button>
            </div>
          </form>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-lg bg-[var(--surface-muted)]/50 border border-dashed border-[var(--border-border)]">
            <p className="text-xs text-[var(--text-muted)]">
              No internal notes recorded yet. Add private team notes regarding discussions, quotes, or specifications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.public_id}
                className="p-3.5 rounded-lg border border-[var(--border-border)] bg-[var(--surface-muted)]/40 hover:bg-[var(--surface-muted)] transition-colors group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--surface-surface)] border border-[var(--border-border)] flex items-center justify-center text-[var(--text-secondary)]">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {note.user?.name || 'Administrator'}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {formatDateTime(note.created_at)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.public_id)}
                    disabled={isDeleting}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--status-error)] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Note"
                    aria-label="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap pl-8">
                  {note.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnquiryNotes;

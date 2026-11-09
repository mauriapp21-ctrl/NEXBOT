"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ListVideo } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RecordedInteraction, Step } from "@/types";

import { EditInteractionDialog } from "./edit-interaction-dialog";
import { TimelineItem } from "./timeline-item";
import type { RecorderController } from "./use-recorder";

/** What the timeline needs from a recorder (simulated or real). */
export type TimelineController = Pick<
  RecorderController,
  "interactions" | "status" | "playing" | "moveInteraction" | "updateInteraction" | "removeInteraction"
>;

const position = (list: RecordedInteraction[], id: unknown) => list.findIndex((i) => i.id === id) + 1;

export function ActionTimeline({
  recorder,
  mode = "simulated",
}: {
  recorder: TimelineController;
  /** Where interactions happen, for the empty-state copy. */
  mode?: "simulated" | "real";
}) {
  const { interactions, status, playing } = recorder;
  const [editing, setEditing] = useState<RecordedInteraction | null>(null);
  const [deleting, setDeleting] = useState<RecordedInteraction | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const locked = playing;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Paso ${position(interactions, active.id)} tomado.`,
    onDragOver: ({ over }) => (over ? `Sobre la posición ${position(interactions, over.id)}.` : "Fuera de la lista."),
    onDragEnd: ({ over }) => (over ? `Paso soltado en la posición ${position(interactions, over.id)}.` : "Paso soltado."),
    onDragCancel: () => "Reordenamiento cancelado.",
  };

  // Keep the newest interaction in view while recording.
  useEffect(() => {
    if (status === "recording") endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [interactions.length, status]);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    recorder.moveInteraction(position(interactions, active.id) - 1, position(interactions, over.id) - 1);
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border bg-card" aria-labelledby="timeline-title">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <h2 id="timeline-title" className="text-sm font-semibold">
          Línea de tiempo
        </h2>
        <span className="tabular rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground" aria-live="polite">
          {interactions.length} {interactions.length === 1 ? "paso" : "pasos"}
        </span>
      </div>

      {interactions.length === 0 ? (
        <EmptyState
          variant="compact"
          icon={ListVideo}
          title={status === "idle" ? "Aún no hay pasos" : "Esperando interacciones"}
          description={
            status === "idle"
              ? mode === "real"
                ? "Inicia la grabación y trabaja en la ventana de Google Chrome: cada clic, texto o archivo se registrará aquí."
                : "Inicia la grabación y trabaja en el navegador simulado: cada clic, texto o archivo se registrará aquí."
              : mode === "real"
                ? "Haz clic, escribe o selecciona un archivo en la ventana de Google Chrome."
                : "Haz clic, escribe o selecciona un archivo dentro del navegador."
          }
          className="flex-1"
        />
      ) : (
        <ScrollArea type="auto" className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            accessibility={{
              announcements,
              screenReaderInstructions: {
                draggable:
                  "Para reordenar, presiona espacio o Enter, muévete con las flechas y suelta con espacio o Enter. Escape cancela.",
              },
            }}
          >
            <SortableContext items={interactions.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ol className="space-y-2 p-3" aria-label="Pasos grabados">
                {interactions.map((interaction, index) => (
                  <TimelineItem
                    key={interaction.id}
                    interaction={interaction}
                    index={index}
                    disabled={locked}
                    onEdit={() => setEditing(interaction)}
                    onDelete={() => setDeleting(interaction)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
          <div ref={endRef} />
        </ScrollArea>
      )}

      <EditInteractionDialog
        step={editing?.step ?? null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={(step: Step) => {
          if (editing) recorder.updateInteraction(editing.id, step);
          setEditing(null);
        }}
      />
      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="¿Eliminar este paso?"
        description={deleting ? `"${deleting.step.name}" se quitará de la grabación.` : ""}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (deleting) recorder.removeInteraction(deleting.id);
        }}
      />
    </section>
  );
}

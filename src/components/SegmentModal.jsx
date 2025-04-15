import React from "react";
import "./SegmentModal.css";

export default function SegmentModal({ segments, onSelect, onClose, selectedSegment }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Seleziona Segmento</h3>
        {segments && segments.length > 0 ? (
          <>
            <select
              value={selectedSegment?.id || ""}
              onChange={(e) => {
                const selected = segments.find(seg => seg.id === e.target.value);
                onSelect(selected);
              }}
            >
              <option value="">-- Seleziona un segmento --</option>
              {segments.map(segment => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
            <div>Segmenti disponibili: {segments.length}</div>
          </>
        ) : (
          <p>Nessun segmento disponibile</p>
        )}
        <button onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}

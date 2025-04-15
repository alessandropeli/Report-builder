import React from "react";

export default function SegmentModal({ segments, onSelect, onClose, selectedSegment }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Seleziona Segmento</h3>
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
        <button onClick={onClose} style={{ marginTop: 16 }}>Chiudi</button>
      </div>
    </div>
  );
}

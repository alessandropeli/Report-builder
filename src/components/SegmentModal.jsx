import React, { useEffect } from "react";
import "./SegmentModal.css";

export default function SegmentModal({ segments, onSelect, onClose, selectedSegment }) {
  useEffect(() => {
    console.log("SegmentModal - segments:", segments);
    console.log("SegmentModal - selectedSegment:", selectedSegment);
  }, [segments, selectedSegment]);

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Seleziona Segmento</h3>
        {Array.isArray(segments) && segments.length > 0 ? (
          <>
            <select
              value={selectedSegment?.id || ""}
              onChange={(e) => {
                const selected = segments.find(seg => seg.id === e.target.value);
                console.log("Selected segment:", selected);
                onSelect(selected);
              }}
            >
              <option value="">-- Seleziona un segmento --</option>
              {segments.map(segment => (
                <option key={segment.id} value={segment.id}>
                  {segment.name || segment.id}
                </option>
              ))}
            </select>
            <p style={{fontSize: '0.8em', color: '#666'}}>
              {segments.length} segmenti disponibili
            </p>
          </>
        ) : (
          <p style={{color: 'red'}}>
            Nessun segmento disponibile
            <br />
            <small>
              {Array.isArray(segments) 
                ? "Array vuoto" 
                : "Segments non è un array"}
            </small>
          </p>
        )}
        <button onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}

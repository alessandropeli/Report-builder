import React from "react";

const SegmentModal = ({ segments, onSelect, onClose, selectedSegment }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Seleziona un segmento</h3>
        <ul>
          {segments.map(segment => (
            <li key={segment.id}>
              <button
                style={{
                  fontWeight: selectedSegment?.id === segment.id ? "bold" : "normal"
                }}
                onClick={() => onSelect(segment)}
              >
                {segment.name}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={onClose} style={{ marginTop: "16px" }}>
          Chiudi
        </button>
      </div>
    </div>
  );
};

export default SegmentModal;

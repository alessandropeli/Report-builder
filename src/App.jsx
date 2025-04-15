import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { FaFilter } from "react-icons/fa";
import SegmentModal from "./components/SegmentModal";
import "./components/SegmentModal.css";

export default function ReportBuilder() {
  const [rows, setRows] = useState([{ id: 1, label: "" }]);
  const [columns, setColumns] = useState([[]]);
  const [accessToken, setAccessToken] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [authUrl, setAuthUrl] = useState(null);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [availableDimensions, setAvailableDimensions] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [notes, setNotes] = useState([{ id: 1, columns: [""] }]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [segments, setSegments] = useState([]);
  const operations = ["+", "-", "*", "/"];

  const handleAddNote = () => {
    setNotes(prev => [...prev, { id: prev.length + 1, columns: [""] }]);
  };

  const handleNoteChange = (noteIndex, colIndex, value) => {
    const updated = [...notes];
    updated[noteIndex].columns[colIndex] = value;
    setNotes(updated);
  };

  const handleRemoveNoteColumn = (noteIndex, colIndex) => {
    const updated = [...notes];
    updated[noteIndex].columns.splice(colIndex, 1);
    setNotes(updated);
  };

  const handleAddNoteColumn = (noteIndex) => {
    const updated = [...notes];
    updated[noteIndex].columns.push("");
    setNotes(updated);
  };

  const handleRemoveNoteRow = (noteIndex) => {
    const updated = [...notes];
    updated.splice(noteIndex, 1);
    setNotes(updated);
  };

  const handleAddRow = () => {
    const newRow = { id: rows.length + 1, label: "" };
    setRows(prev => [...prev, newRow]);
    setColumns(prev => [...prev, []]);
  };

  const handleInputChange = (rowIndex, colIndex, value, type = "metric") => {
    const updatedCols = [...columns];
    const targetCol = { ...updatedCols[rowIndex][colIndex] };

    if (type === "metric") {
      targetCol.metric = value;
    } else {
      targetCol.additional = value;
    }

    updatedCols[rowIndex][colIndex] = targetCol;
    setColumns(updatedCols);
  };

  const handleAddColumnToRow = (rowIndex, selectedType) => {
    if (!selectedType) return;
    const newCol = {
      type: selectedType,
      metric: "",
      additional: ""
    };
    const updatedCols = [...(columns[rowIndex] || []), newCol];
    const updated = [...columns];
    updated[rowIndex] = updatedCols;
    setColumns(updated);
  };

  const handleRemoveColumn = (rowIndex, colIndex) => {
    const updatedCols = [...columns];
    updatedCols[rowIndex] = updatedCols[rowIndex].filter((_, idx) => idx !== colIndex);
    setColumns(updatedCols);
  };

  const handleRemoveRow = (rowIndex) => {
    const updatedRows = rows.filter((_, i) => i !== rowIndex);
    const updatedColumns = columns.filter((_, i) => i !== rowIndex);
    setRows(updatedRows);
    setColumns(updatedColumns);
  };

  const handleLabelChange = (rowIndex, value) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].label = value;
    setRows(updatedRows);
  };

  const handleFilterMetricBySegment = (metricData) => {
    if (!selectedSegment) return metricData;
    return metricData.filter(item => item.segmentId === selectedSegment.id);
  };

  useEffect(() => {
    fetch("/api/auth-url")
      .then(res => res.json())
      .then(data => setAuthUrl(data.url));
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code && !accessToken) {
      fetch(`/api/auth-callback?code=${code}`)
        .then(res => res.json())
        .then(data => {
          setAccessToken(data.access_token);
          fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
            headers: { Authorization: `Bearer ${data.access_token}` }
          })
            .then(res => res.json())
            .then(result => {
              const props = result.accountSummaries?.flatMap(acc => acc.propertySummaries?.map(p => ({ name: p.property, displayName: p.displayName })) || []) || [];
              setProperties(props);
            });
        });
    }
  }, [accessToken]);

  useEffect(() => {
    if (selectedProperty && accessToken) {
      fetch(`https://analyticsdata.googleapis.com/v1beta/${selectedProperty}/metadata`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then(res => res.json())
        .then(data => {
          setAvailableMetrics(data.metrics?.map(m => m.apiName) || []);
          setAvailableDimensions(data.dimensions?.map(d => d.apiName) || []);
        });
    }
  }, [selectedProperty, accessToken]);

  useEffect(() => {
    if (selectedProperty && accessToken) {
      console.log("Fetching segments for property:", selectedProperty);
      fetch(`https://analyticsdata.googleapis.com/v1beta/${selectedProperty}/segments`, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          console.log("Segment API response status:", res.status);
          if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          console.log("Segments API response:", data);
          if (data.segments) {
            const fetchedSegments = data.segments.map(segment => ({
              id: segment.segmentId || segment.name,
              name: segment.displayName || segment.name
            }));
            console.log("Processed segments:", fetchedSegments);
            setSegments(fetchedSegments);
          }
        })
        .catch(err => {
          console.error("Error loading segments:", err);
          setSegments([]); // Reset segments on error
        });
    }
  }, [selectedProperty, accessToken]);

  const handleGenerateReport = () => {
    const flatMetrics = columns.flatMap(rowCols =>
      rowCols.filter(col => col.type === "metric" && col.metric).map(col => col.metric)
    );
    const allMetrics = [...new Set(flatMetrics)];

    if (!selectedProperty || allMetrics.length === 0) return;

    const dimensionFilters = columns.flatMap(rowCols =>
      rowCols.filter(col => col.type === "filter" && col.additional).map(col => ({ fieldName: col.additional, stringFilter: { value: "true" } }))
    );

    const requestBody = {
      metrics: allMetrics.map(name => ({ name })),
      dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }]
    };

    if (dimensionFilters.length > 0) {
      requestBody.dimensionFilter = {
        andGroup: {
          expressions: dimensionFilters.map(filter => ({ filter }))
        }
      };
    }

    fetch(`https://analyticsdata.googleapis.com/v1beta/${selectedProperty}:runReport`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })
      .then(res => res.json())
      .then(data => {
        const valueMap = {};
        const headers = data.metricHeaders || [];
        const values = data.rows?.[0]?.metricValues || [];

        headers.forEach((h, i) => {
          valueMap[h.name] = parseFloat(values[i]?.value || 0);
        });

        const finalTable = rows.map((row, rowIndex) => {
          const rowCols = columns[rowIndex] || [];
          let resultValue = "-";

          if (rowCols.length === 3 && rowCols[0].type === "metric" && rowCols[1].type === "operation" && rowCols[2].type === "metric") {
            const v1 = valueMap[rowCols[0].metric] ?? null;
            const v2 = valueMap[rowCols[2].metric] ?? null;
            const op = rowCols[1].additional;

            if (!isNaN(v1) && !isNaN(v2)) {
              switch (op) {
                case "/": resultValue = v2 !== 0 ? (v1 / v2).toFixed(2) : "∞"; break;
                case "*": resultValue = (v1 * v2).toFixed(2); break;
                case "-": resultValue = (v1 - v2).toFixed(2); break;
                case "+": resultValue = (v1 + v2).toFixed(2); break;
                default: resultValue = "-";
              }
            }
          } else if (rowCols.length === 1 && rowCols[0].type === "metric") {
            resultValue = valueMap[rowCols[0].metric] ?? "-";
          }

          return { label: row.label, values: [resultValue] };
        });

        setTableData(finalTable);
      });
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Generatore Report</h1>

      {!accessToken && authUrl && (
        <a href={authUrl}><button>🔑 Connetti Google Analytics</button></a>
      )}

      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label>Seleziona proprietà:</label>
          <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}>
            <option value="">--</option>
            {properties.map(p => (
              <option key={p.name} value={p.name}>{p.displayName}</option>
            ))}
          </select>
        </div>
        <h3>📝 Dettagli del report</h3>
        <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {notes[0].columns.map((col, colIndex) => (
                <th key={`col-head-export-${colIndex}`} style={{ position: 'relative' }}>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const updated = [...notes];
                      updated.forEach(row => {
                        if (row.columns[colIndex] !== undefined) {
                          row.columns[colIndex] = e.target.innerText;
                        }
                      });
                      setNotes(updated);
                    }}
                    style={{ display: 'inline-block', minWidth: '100px', borderBottom: '1px dashed #ccc', cursor: 'text' }}
                  >
                    {col || `Colonna ${colIndex + 1}`}
                  </span>
                  <button
                    onClick={() => handleRemoveNoteColumn(0, colIndex)}
                    style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', fontSize: '0.4rem', cursor: 'pointer', lineHeight: 1 }}
                  >❌</button>
                </th>
              ))}
              <th style={{ width: 40 }}></th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note, i) => (
              <tr key={note.id}>
                {note.columns.map((col, colIndex) => (
                  <td key={`col-${i}-${colIndex}`}>
                    <input
                      type="text"
                      placeholder="Scrivi..."
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={col}
                      onChange={e => handleNoteChange(i, colIndex, e.target.value)}
                    />

                  </td>
                ))}
                <td>
                  <button onClick={() => handleAddNoteColumn(i)}>➕</button>
                </td>
                <td>
                  <button onClick={() => handleRemoveNoteRow(i)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={handleAddNote} style={{ marginTop: 8 }}>➕ Aggiungi riga</button>
      </div>
      <div style={{ marginTop: 24 }}>

        <table border="1" cellPadding="6" style={{ marginTop: 16, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Label", "Colonne dinamiche", "Aggiungi colonna"].map((header, index) => (
                <th key={`header-${index}`}>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      // eventualmente aggiornabile se vuoi salvare i nomi personalizzati delle colonne
                    }}
                    style={{ display: 'inline-block', minWidth: '100px', borderBottom: '1px dashed #ccc', cursor: 'text' }}
                  >
                    {header}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => handleLabelChange(rowIndex, e.target.value)}
                    placeholder="Scrivi label"
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(columns[rowIndex] || []).map((col, colIndex) => (
                      <div key={colIndex} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {col.type === "metric" ? (
                          <>
                            <select
                              value={col.metric}
                              onChange={e => handleInputChange(rowIndex, colIndex, e.target.value, "metric")}
                            >
                              <option value="">--</option>
                              {availableMetrics.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <span
                              style={{ marginLeft: 8, cursor: 'pointer' }}
                              title="Filtra per segmento"
                              onClick={() => setShowSegmentModal(true)}
                            >
                              <FaFilter />
                            </span>
                          </>
                        ) : col.type === "operation" ? (
                          <select
                            value={col.additional}
                            onChange={e => handleInputChange(rowIndex, colIndex, e.target.value, "additional")}
                          >
                            <option value="">--</option>
                            {operations.map(op => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={col.additional}
                            onChange={e => handleInputChange(rowIndex, colIndex, e.target.value, "additional")}
                          >
                            <option value="">--</option>
                            {availableDimensions.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        )}
                        <button onClick={() => handleRemoveColumn(rowIndex, colIndex)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.3rem', lineHeight: 1 }}>❌</button>
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      handleAddColumnToRow(rowIndex, e.target.value);
                      e.target.selectedIndex = 0;
                    }}
                  >
                    <option value="">➕ Tipo colonna</option>
                    <option value="metric">📊 Metrica</option>
                    <option value="operation">➗ Operazione</option>
                    <option value="segment">🎯 Segmento</option>
                    <option value="filter">🔍 Filtro</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={handleAddRow} style={{ marginTop: 8 }}>➕ Aggiungi riga</button>
      </div>

      {showSegmentModal && (
        <SegmentModal
          segments={segments}
          onSelect={(segment) => {
            setSelectedSegment(segment);
            setShowSegmentModal(false);
          }}
          onClose={() => setShowSegmentModal(false)}
          selectedSegment={selectedSegment}
        />
      )}

      {tableData.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>📝 Dettagli del report</h3>
          <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {notes[0].columns.map((_, colIndex) => (
                  <th key={`col-head-export-${colIndex}`}>Colonna {colIndex + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {notes.map((note, i) => (
                <tr key={`row-export-${i}`}>
                  {note.columns.map((col, colIndex) => (
                    <td key={`col-export-${i}-${colIndex}`}>{col}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Risultati</h3>
          <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>Label</th>
                <th>Valore</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i}>
                  <td>{row.label}</td>
                  <td>{row.values[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={handleGenerateReport}>📊 Genera Report</button>
        <button
          onClick={() => {
            const doc = new jsPDF();
            doc.text("Report Google Analytics", 14, 16);

            const detailHeaders = notes[0].columns.map((_, i) => `Colonna ${i + 1}`);
            const detailBody = notes.map(note => note.columns);
            doc.autoTable({ head: [detailHeaders], body: detailBody, startY: 20 });

            const head = ["Label", "Valore"];
            const body = tableData.map(r => [r.label, ...r.values]);
            doc.autoTable({ head: [head], body, startY: doc.lastAutoTable.finalY + 10 });

            doc.save("report_ga4.pdf");
          }}
          style={{ marginLeft: 12 }}
        >📄 Esporta PDF</button>
        <button
          onClick={() => {
            const wb = XLSX.utils.book_new();
            const detailSheet = XLSX.utils.aoa_to_sheet([
              notes[0].columns,
              ...notes.map(note => note.columns)
            ]);
            XLSX.utils.book_append_sheet(wb, detailSheet, "Dettagli Report");

            const ws = XLSX.utils.aoa_to_sheet([
              ["Label", "Valore"],
              ...tableData.map(row => [row.label, ...row.values])
            ]);
            XLSX.utils.book_append_sheet(wb, ws, "Risultati Report");
            XLSX.writeFile(wb, "report_ga4.xlsx");
          }}
          style={{ marginLeft: 12 }}
        >📊 Esporta Excel</button>
      </div>
    </div>
  );
}

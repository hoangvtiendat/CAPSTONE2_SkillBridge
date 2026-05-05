import React, { useState } from 'react';

const renderValue = (value) => {
    if (value === null || value === undefined) return String(value);
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
};

const JDResponseTable = ({ data }) => {
    const [showRaw, setShowRaw] = useState(false);
    if (!data) return null;

    const entries = Object.entries(data);

    return (
        <section className="form-card content-card" style={{ marginTop: 12 }}>
           

            {showRaw ? (
                <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 6, maxHeight: 320, overflow: 'auto' }}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Trường</th>
                                <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Giá trị</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(([key, value]) => (
                                <tr key={key}>
                                    <td style={{ verticalAlign: 'top', padding: '8px 6px', borderBottom: '1px solid #f1f5f9', width: '30%' }}>{key}</td>
                                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>
                                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{renderValue(value)}</pre>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default JDResponseTable;

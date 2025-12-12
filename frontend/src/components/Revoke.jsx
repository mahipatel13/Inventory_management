import React, { useEffect, useState } from 'react';
import strengthService from '../services/api';
import './Revoke.css';

const Revoke = () => {
  const [revokeList, setRevokeList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRevokeList = async () => {
      setLoading(true);
      try {
        const response = await strengthService.fetchRevokes();
        setRevokeList(response.data || []);
      } catch (error) {
        console.error('Failed to load revoke entries', error);
      } finally {
        setLoading(false);
      }
    };

    loadRevokeList();
  }, []);

  return (
    <section className="revoke">
      <h2>Revoke Notices</h2>
      {loading && <p>Loading revoke requests…</p>}
      {!loading && revokeList.length === 0 && <p>No revokes recorded.</p>}
      <div className="revoke-grid">
        {revokeList.map((item) => (
          <article className="revoke-card" key={item.id}>
            <h3>{item.subject}</h3>
            <p>
              <strong>Semester:</strong> {item.semester}
            </p>
            <p>
              <strong>Date:</strong> {item.date}
            </p>
            <p>
              <strong>Slot:</strong> {item.slot}
            </p>
            <p>
              <strong>Room:</strong> {item.room}
            </p>
            <p>
              <strong>Reason:</strong> {item.reason}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Revoke;
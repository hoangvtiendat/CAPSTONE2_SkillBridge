import React from 'react';
import './Stats.css';

const Stats = () => {
  const stats = [
    {
      id: 1,
      number: '10K+',
      label: 'Công Việc'
    },
    {
      id: 2,
      number: '5K+',
      label: 'Công Ty'
    },
    {
      id: 3,
      number: '50K+',
      label: 'Ứng Viên'
    },
    {
      id: 4,
      number: '95%',
      label: 'Satisfaction'
    }
  ];

  return (
    <section className="stats">
      <div className="stats-container">
        {stats.map((stat) => (
          <div key={stat.id} className="stat-item">
            <div className="stat-number">{stat.number}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;

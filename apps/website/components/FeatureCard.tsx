'use client';

import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

export function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-6 transition-all hover:border-slate-600 hover:shadow-lg">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-hover:opacity-10`}
      ></div>
      <div className="relative">
        <div className="mb-4 text-4xl">{icon}</div>
        <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
        <p className="text-slate-400">{description}</p>
      </div>
    </div>
  );
}

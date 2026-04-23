// components/car/CarViewer3D.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DoorOpen, RotateCcw, Wrench, ZoomIn } from 'lucide-react';
import { cn } from '../../lib/utils';
import { vehicle } from '../../data/vehicle';
import { views } from '../../data/views';
import { hotspots } from '../../data/hotspots';
import { areas } from '../../data/areas';
import { systems } from '../../data/systems';

type ViewId = typeof views[number]['id'];

const VIEW_LABELS: Record<string, string> = {
  front: 'Frente',
  rear: 'Traseira',
  left: 'Lado Esq.',
  right: 'Lado Dir.',
  top: 'Superior',
  interior: 'Interior',
};

const AREA_STYLE: Record<string, string> = {
  engine_bay: 'bg-cyan-400',
  cabin: 'bg-emerald-400',
  trunk: 'bg-amber-400',
  exterior: 'bg-fuchsia-400',
  undercarriage: 'bg-orange-400',
};

function getAreaHotspots(viewId: ViewId) {
  return hotspots
    .filter((hotspot) => hotspot.view === viewId)
    .map((hotspot) => {
      const area = areas.find((item) => item.id === hotspot.area);
      const primarySystemId = area?.systemIds[0];
      const primarySystem = systems.find((system) => system.id === primarySystemId);

      return {
        id: `${hotspot.view}-${hotspot.area}`,
        label: area?.name ?? hotspot.area,
        x: hotspot.x,
        y: hotspot.y,
        href: primarySystemId ? `/systems/${primarySystemId}` : '/',
        systems: area?.systemIds ?? [],
        areaType: area?.areaType ?? 'exterior',
        description: primarySystem?.name ?? area?.description ?? '',
      };
    });
}

function VehicleShape({ viewType }: { viewType: string }) {
  if (viewType === 'front') {
    return (
      <g fill="currentColor">
        <ellipse cx="200" cy="118" rx="146" ry="60" />
        <rect x="92" y="80" width="216" height="56" rx="18" />
        <rect x="126" y="58" width="148" height="34" rx="12" />
        <rect x="82" y="104" width="24" height="20" rx="6" />
        <rect x="294" y="104" width="24" height="20" rx="6" />
        <circle cx="122" cy="150" r="24" fill="none" stroke="currentColor" strokeWidth="8" />
        <circle cx="278" cy="150" r="24" fill="none" stroke="currentColor" strokeWidth="8" />
      </g>
    );
  }

  if (viewType === 'rear') {
    return (
      <g fill="currentColor">
        <ellipse cx="200" cy="118" rx="138" ry="56" />
        <rect x="90" y="84" width="220" height="54" rx="18" />
        <rect x="120" y="62" width="160" height="32" rx="12" />
        <rect x="102" y="102" width="24" height="18" rx="5" />
        <rect x="274" y="102" width="24" height="18" rx="5" />
        <circle cx="126" cy="146" r="22" fill="none" stroke="currentColor" strokeWidth="8" />
        <circle cx="274" cy="146" r="22" fill="none" stroke="currentColor" strokeWidth="8" />
      </g>
    );
  }

  if (viewType === 'left' || viewType === 'right') {
    return (
      <g fill="currentColor">
        <rect x="56" y="102" width="288" height="46" rx="14" />
        <path d="M108 102 L140 68 L266 68 L304 102 Z" />
        <rect x="146" y="74" width="48" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="204" y="74" width="48" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="118" cy="144" r="25" fill="none" stroke="currentColor" strokeWidth="8" />
        <circle cx="286" cy="144" r="25" fill="none" stroke="currentColor" strokeWidth="8" />
      </g>
    );
  }

  if (viewType === 'top') {
    return (
      <g fill="currentColor">
        <rect x="112" y="26" width="176" height="148" rx="36" />
        <rect x="136" y="42" width="128" height="116" rx="20" fill="none" stroke="currentColor" strokeWidth="8" />
        <rect x="118" y="48" width="16" height="34" rx="6" />
        <rect x="266" y="48" width="16" height="34" rx="6" />
        <rect x="118" y="118" width="16" height="34" rx="6" />
        <rect x="266" y="118" width="16" height="34" rx="6" />
      </g>
    );
  }

  return (
    <g fill="currentColor">
      <rect x="90" y="40" width="220" height="120" rx="16" />
      <rect x="110" y="56" width="180" height="88" rx="12" fill="none" stroke="currentColor" strokeWidth="6" />
      <rect x="126" y="72" width="62" height="36" rx="8" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="212" y="72" width="62" height="36" rx="8" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="152" cy="126" r="8" />
      <circle cx="248" cy="126" r="8" />
    </g>
  );
}

export default function CarViewer3D() {
  const [activeView, setActiveView] = useState<ViewId>('view-front');
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  const activeViewData = views.find((view) => view.id === activeView) ?? views[0];
  const activeHotspots = getAreaHotspots(activeView);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">🚗</span>
          <span className="font-medium">{vehicle.brand} {vehicle.model} {vehicle.version} {vehicle.year}/{vehicle.modelYear}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <ZoomIn size={14} />
          <span>Viewer funcional por áreas do veículo</span>
        </div>
      </div>

      {/* View Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 border-b border-zinc-800">
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition flex items-center justify-center gap-2',
              activeView === view.id
                ? 'bg-cyan-900/30 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            )}
          >
            <span>{VIEW_LABELS[view.viewType] ?? view.name}</span>
          </button>
        ))}
      </div>

      {/* Car Display */}
      <div className="relative aspect-[16/9] bg-gradient-to-b from-zinc-800 to-zinc-900">
        {/* Car Silhouette SVG */}
        <svg
          viewBox="0 0 400 200"
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.18 }}
        >
          <VehicleShape viewType={activeViewData.viewType} />
        </svg>

        {/* Hotspots */}
        {activeHotspots.map(hotspot => (
          <Link
            key={hotspot.id}
            href={hotspot.href}
            onMouseEnter={() => setHoveredHotspot(hotspot.id)}
            onMouseLeave={() => setHoveredHotspot(null)}
            className="absolute group"
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
          >
            {/* Pulse animation */}
            <span
              className={cn(
                'absolute -inset-3 rounded-full animate-ping',
                AREA_STYLE[hotspot.areaType] ?? 'bg-cyan-400',
                hoveredHotspot === hotspot.id ? 'opacity-100' : 'opacity-50'
              )}
            />
            {/* Dot */}
            <span
              className={cn(
                'relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200',
                hoveredHotspot === hotspot.id
                  ? `${AREA_STYLE[hotspot.areaType] ?? 'bg-cyan-400'} scale-125`
                  : `${AREA_STYLE[hotspot.areaType] ?? 'bg-cyan-400'} group-hover:scale-110`
              )}
            >
              <span className="w-2 h-2 bg-zinc-900 rounded-full" />
            </span>
            {/* Label tooltip */}
            <span
              className={cn(
                'absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-zinc-800 text-xs text-zinc-200 rounded whitespace-nowrap transition-opacity',
                hoveredHotspot === hotspot.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            >
              {hotspot.label}
            </span>
          </Link>
        ))}

        {/* Hint overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/70 px-3 py-2 rounded-full border border-zinc-800">
          <RotateCcw size={12} />
          <span>{activeViewData.name}</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/30">
        <p className="text-xs text-zinc-500 mb-2">Áreas e sistemas nesta vista:</p>
        <div className="grid gap-2">
          {activeHotspots.map((hotspot) => (
            <div key={hotspot.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-zinc-100">{hotspot.label}</p>
                <p className="text-xs text-zinc-500 truncate">{hotspot.description}</p>
              </div>
              <Link
                href={hotspot.href}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-cyan-400 rounded transition"
              >
                {hotspot.areaType === 'cabin' ? <DoorOpen size={12} /> : <Wrench size={12} />}
                Abrir
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

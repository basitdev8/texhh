import type { IPCBuild, IPCComponent } from '@/types';

export type CompatibilityStatus = 'compatible' | 'warning' | 'incompatible';

export interface CompatibilityResult {
  status: CompatibilityStatus;
  messages: string[];
  errors: string[];
  warnings: string[];
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function spec(component: IPCComponent | null, aliases: string[]): string | undefined {
  if (!component) return undefined;
  const normalisedAliases = aliases.map(normalise);
  const entry = Object.entries(component.specifications || {}).find(([key]) =>
    normalisedAliases.includes(normalise(key))
  );
  return entry?.[1]?.trim() || undefined;
}

function numberFrom(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.replace(',', '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function ddrType(value: string | undefined): string | undefined {
  const match = value?.toUpperCase().match(/DDR\s*([345])/);
  return match ? `DDR${match[1]}` : undefined;
}

function motherboardFitsCase(motherboard: string, caseFormFactor: string): boolean {
  const board = normalise(motherboard);
  const enclosure = normalise(caseFormFactor);

  if (enclosure.includes('fulltower')) return true;
  if (enclosure.includes('midtower')) {
    return ['eatx', 'atx', 'microatx', 'matx', 'miniitx', 'itx'].some((factor) => board.includes(factor));
  }
  if (enclosure.includes('microatx') || enclosure.includes('matx')) {
    return ['microatx', 'matx', 'miniitx', 'itx'].some((factor) => board.includes(factor));
  }
  if (enclosure.includes('miniitx') || enclosure === 'itx') {
    return board.includes('miniitx') || board === 'itx';
  }

  // For explicit compatibility strings such as "ATX, mATX, Mini-ITX".
  return enclosure.includes(board) || board.includes(enclosure);
}

function selected(build: IPCBuild): IPCComponent[] {
  return Object.values(build).filter(Boolean) as IPCComponent[];
}

/**
 * Evaluates only facts available in the selected components' specifications.
 * Missing supplier data is a warning, never a false "compatible" claim.
 */
export function evaluatePcCompatibility(build: IPCBuild): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const parts = selected(build);

  if (parts.length < 8) {
    warnings.push(`${8 - parts.length} required part${8 - parts.length === 1 ? '' : 's'} not selected`);
  }

  const cpuSocket = spec(build.CPU, ['Socket']);
  const motherboardSocket = spec(build.Motherboard, ['Socket']);
  if (build.CPU && build.Motherboard) {
    if (!cpuSocket || !motherboardSocket) {
      warnings.push('CPU or motherboard socket is missing from specifications');
    } else if (normalise(cpuSocket) !== normalise(motherboardSocket)) {
      errors.push(`CPU socket ${cpuSocket} does not match motherboard socket ${motherboardSocket}`);
    }
  }

  const ramType = ddrType(spec(build.RAM, ['Type', 'Memory Type', 'Speed']));
  const motherboardRamType = ddrType(spec(build.Motherboard, ['RAM Type', 'Memory Type', 'Supported Memory', 'Memory']));
  if (build.RAM && build.Motherboard) {
    if (!ramType || !motherboardRamType) {
      warnings.push('RAM or motherboard DDR generation is missing from specifications');
    } else if (ramType !== motherboardRamType) {
      errors.push(`RAM type ${ramType} does not match motherboard support ${motherboardRamType}`);
    }
  }

  const motherboardFormFactor = spec(build.Motherboard, ['Form Factor', 'Format']);
  const caseFormFactor = spec(build.Case, ['Form Factor', 'Supported Motherboard Form Factors']);
  if (build.Motherboard && build.Case) {
    if (!motherboardFormFactor || !caseFormFactor) {
      warnings.push('Motherboard or case form factor is missing from specifications');
    } else if (!motherboardFitsCase(motherboardFormFactor, caseFormFactor)) {
      errors.push(`Motherboard form factor ${motherboardFormFactor} does not fit case ${caseFormFactor}`);
    }
  }

  const coolerHeight = numberFrom(spec(build.Cooler, ['Height', 'Cooler Height']));
  const caseCoolerClearance = numberFrom(spec(build.Case, ['Cooler Clearance', 'CPU Cooler Clearance', 'Max Cooler Height']));
  if (build.Cooler && build.Case) {
    if (!coolerHeight || !caseCoolerClearance) {
      warnings.push('Cooler height or case cooler clearance is missing from specifications');
    } else if (coolerHeight > caseCoolerClearance) {
      errors.push(`Cooler height ${coolerHeight}mm exceeds case clearance ${caseCoolerClearance}mm`);
    }
  }

  const cpuPower = numberFrom(spec(build.CPU, ['Power', 'TDP', 'Maximum Turbo Power']));
  const gpuPower = numberFrom(spec(build.GPU, ['Power', 'Total Graphics Power', 'TGP']));
  const psuWattage = numberFrom(spec(build.PSU, ['Wattage', 'Power']));
  if (build.PSU && (build.CPU || build.GPU)) {
    if (!psuWattage) {
      warnings.push('PSU wattage is missing from specifications');
    } else {
      const knownDraw = (cpuPower || 0) + (gpuPower || 0);
      const requiredWattage = Math.ceil((knownDraw + 150) * 1.25);
      if (psuWattage < requiredWattage) {
        errors.push(`PSU ${psuWattage}W is below the estimated ${requiredWattage}W requirement with headroom`);
      } else if (!cpuPower || !gpuPower) {
        warnings.push('CPU or GPU power draw is missing; PSU estimate is incomplete');
      }
    }
  }

  const status: CompatibilityStatus = errors.length > 0
    ? 'incompatible'
    : warnings.length > 0
      ? 'warning'
      : 'compatible';

  return { status, messages: [...errors, ...warnings], errors, warnings };
}

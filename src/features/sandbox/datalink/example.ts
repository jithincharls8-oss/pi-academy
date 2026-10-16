import type { Cells } from './sheet';

/** A ready-made Riverbend feed pump report using each implemented DataLink function. */
export function pumpReport(): Cells {
  const c: Cells = {
    A1: 'Riverbend feed pump report',
    G1: 'Server',
    H1: '\\\\PISRV01',
    A2: 'Start',
    B2: 't',
    C2: 'End',
    D2: '*',
    G2: 'Report run',
    H2: '=NOW()',
    A3: 'Tag',
    B3: 'Current',
    C3: 'Average today',
    D3: 'Max today',
    E3: 'Total today (m3)',
    F3: 'Value 1 h ago',
    G3: 'Pump status',
    A7: 'Total flow now',
    B7: '=SUM(B4:B6)',
    C7: '=SUM(C4:C6)',
    E7: '=SUM(E4:E6)',
    A8: 'Same total by PE',
    B8: "=PIExpVal(\"'RB.P101.FLOW'+'RB.P102.FLOW'+'RB.P103.FLOW'\",\"*\",$H$1)",
    A9: 'Difference',
    B9: '=ROUND(B7-B8,3)',
    A11: 'P-101 flow, compressed, last 10 min (outcode 9)',
    E11: 'P-101 flow, hourly samples (outcode 1)',
    H11: 'P-102 at the same times',
    J11: 'Hourly average P-101',
    A12: '=PICompDat(A4,"*-10m","*",9,$H$1,"inside")',
    E12: '=PISampDat(A4,"*-6h","*","1h",1,$H$1)',
    H12: '=PITimeDat(A5,E12:E18,$H$1,"interpolated")',
    J12: '=PIAdvCalcDat(A4,"*-6h","*","1h","average","time-weighted",0,1,0,$H$1)',
  };
  const pumps = ['P101', 'P102', 'P103'];
  pumps.forEach((p, i) => {
    const r = 4 + i;
    c[`A${r}`] = `RB.${p}.FLOW`;
    c[`B${r}`] = `=PICurrVal(A${r},0,$H$1)`;
    c[`C${r}`] = `=PIAdvCalcVal(A${r},$B$2,$D$2,"average","time-weighted",0,1,0,$H$1)`;
    c[`D${r}`] = `=PIAdvCalcVal(A${r},$B$2,$D$2,"maximum","time-weighted",0,1,0,$H$1)`;
    c[`E${r}`] = `=PIAdvCalcVal(A${r},$B$2,$D$2,"total","time-weighted",0,24,0,$H$1)`;
    c[`F${r}`] = `=PIArcVal(A${r},"*-1h",0,$H$1,"auto")`;
    c[`G${r}`] = `=PICurrVal("RB.${p}.STATUS",0,$H$1)`;
  });
  return c;
}

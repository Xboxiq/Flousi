/**
 * Service ports for cross-cutting infrastructure concerns. Keeping these as
 * interfaces lets the domain/application layers stay deterministic and testable.
 */

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  generate(): string;
}

export type ExportFormat = "pdf" | "csv" | "xlsx";

export interface ExportableTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface ExportService {
  export(format: ExportFormat, table: ExportableTable): Promise<Blob>;
}

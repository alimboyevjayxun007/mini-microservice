import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export class JsonStore<T> {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly file: string,
    private readonly initial: T,
  ) {}

  read(): Promise<T> {
    return this.enqueue(() => this.readFile());
  }

  write(value: T): Promise<void> {
    return this.enqueue(() => this.writeFile(value));
  }

  update<R>(mutator: (value: T) => R | Promise<R>): Promise<R> {
    return this.enqueue(async () => {
      const value = await this.readFile();
      const result = await mutator(value);
      await this.writeFile(value);
      return result;
    });
  }

  private enqueue<R>(operation: () => Promise<R>): Promise<R> {
    const result = this.queue.then(operation, operation);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private async readFile(): Promise<T> {
    try {
      return JSON.parse(await fs.readFile(this.file, 'utf8')) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }

      const value = structuredClone(this.initial);
      await this.writeFile(value);
      return value;
    }
  }

  private async writeFile(value: T): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });

    const temporaryFile = `${this.file}.${process.pid}.${randomUUID()}.tmp`;
    await fs.writeFile(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, {
      mode: 0o600,
    });
    await fs.rename(temporaryFile, this.file);
  }
}

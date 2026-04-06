export type InstructionStep = {
  id: string;
  index: number;
  text: string;
};

export function parseInstructionSteps(instructions: string): InstructionStep[] {
  return instructions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `instruction-step-${index}`,
      index,
      text,
    }));
}

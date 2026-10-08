import type { Meta, StoryObj } from '@storybook/react-vite';
import { MousePointer2, Pencil, Square } from 'lucide-react';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from './toolbar';

const meta = {
  title: 'Toolbar',
  component: Toolbar,
  args: { 'aria-label': 'Board tools' },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithButtons: Story = {
  render: (args) => (
    <Toolbar {...args}>
      <ToolbarButton>Select</ToolbarButton>
      <ToolbarButton>Rectangle</ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton disabled>Undo</ToolbarButton>
    </Toolbar>
  ),
};

export const WithToggleGroup: Story = {
  render: (args) => (
    <Toolbar {...args}>
      <ToolbarToggleGroup type="single" defaultValue="select" aria-label="Tool">
        <ToolbarToggleItem value="select" aria-label="Select">
          <MousePointer2 size={18} />
        </ToolbarToggleItem>
        <ToolbarToggleItem value="rectangle" aria-label="Rectangle">
          <Square size={18} />
        </ToolbarToggleItem>
        <ToolbarToggleItem value="pen" aria-label="Pen" disabled>
          <Pencil size={18} />
        </ToolbarToggleItem>
      </ToolbarToggleGroup>
    </Toolbar>
  ),
};

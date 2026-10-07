import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toolbar, ToolbarButton, ToolbarSeparator } from './toolbar';

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

package banner

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type Cell struct {
	Char    string
	Color   string
	BgColor string
}

type Banner struct {
	Width  int
	Height int
	Data   map[string]Cell
}

func NewBanner() Banner {
	return Banner{
		Width:  56,
		Height: 12,
		Data: map[string]Cell{
			"7,2":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"8,2":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"4,3":   {Char: "█", Color: "#6B7784", BgColor: "transparent"},
			"5,3":   {Char: "█", Color: "#6B7784", BgColor: "transparent"},
			"6,3":   {Char: "█", Color: "#6B7784", BgColor: "transparent"},
			"8,3":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"10,3":  {Char: "█", Color: "#A68B5B", BgColor: "transparent"},
			"11,3":  {Char: "█", Color: "#A68B5B", BgColor: "transparent"},
			"12,3":  {Char: "█", Color: "#A68B5B", BgColor: "transparent"},
			"3,4":   {Char: "█", Color: "#6B7784", BgColor: "transparent"},
			"4,4":   {Char: "█", Color: "#6B7784", BgColor: "transparent"},
			"8,4":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"9,4":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"10,4":  {Char: "█", Color: "#8F7A4E", BgColor: "transparent"},
			"11,4":  {Char: "█", Color: "#C4B089", BgColor: "transparent"},
			"12,4":  {Char: "█", Color: "#A68B5B", BgColor: "transparent"},
			"2,5":   {Char: "█", Color: "#5C6772", BgColor: "transparent"},
			"3,5":   {Char: "█", Color: "#6B7784", BgColor: "transparent"},
			"4,5":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"5,5":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"6,5":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"7,5":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"8,5":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"4,6":   {Char: "█", Color: "#6B7784", BgColor: "transparent"},
			"5,6":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"6,6":   {Char: "█", Color: "#8A96A3", BgColor: "transparent"},
			"5,7":   {Char: "█", Color: "#5C6772", BgColor: "transparent"},
			"19,3":  {Char: "█", Color: "#C9D2DC", BgColor: "transparent"},
			"20,3":  {Char: "█", Color: "#C9D2DC", BgColor: "transparent"},
			"21,3":  {Char: "█", Color: "#C9D2DC", BgColor: "transparent"},
			"22,3":  {Char: "█", Color: "#C9D2DC", BgColor: "transparent"},
			"22,4":  {Char: "█", Color: "#C9D2DC", BgColor: "transparent"},
			"22,5":  {Char: "█", Color: "#C9D2DC", BgColor: "transparent"},
			"19,6":  {Char: "█", Color: "#C9D2DC", BgColor: "transparent"},
			"22,6":  {Char: "█", Color: "#C9D2DC", BgColor: "transparent"},
			"20,7":  {Char: "█", Color: "#C9D2DC", BgColor: "transparent"},
			"21,7":  {Char: "█", Color: "#C9D2DC", BgColor: "transparent"},
			"26,3":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"27,3":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"25,4":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"28,4":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"25,5":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"28,5":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"25,6":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"28,6":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"26,7":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"27,7":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"31,3":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"32,3":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"33,3":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"34,3":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"34,4":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"34,5":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"31,6":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"34,6":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"32,7":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"33,7":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"37,3":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"40,3":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"37,4":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"40,4":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"37,5":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"40,5":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"37,6":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"40,6":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"38,7":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"39,7":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"43,3":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"46,3":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"43,4":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"44,4":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"46,4":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"43,5":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"45,5":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"46,5":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"43,6":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"46,6":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"43,7":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"46,7":  {Char: "█", Color: "#A8B4C0", BgColor: "transparent"},
			"19,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"20,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"21,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"22,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"23,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"24,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"25,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"26,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"27,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"28,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"29,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"30,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"31,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"32,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"33,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"34,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"35,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"36,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"37,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"38,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"39,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"40,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"41,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"42,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"43,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"44,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"45,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
			"46,9":  {Char: "─", Color: "#3D4650", BgColor: "transparent"},
		},
	}
}

func (m Banner) Init() tea.Cmd {
	return nil
}

func (m Banner) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		if msg.String() == "q" || msg.String() == "ctrl+c" {
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m Banner) View() string {
	var sb strings.Builder
	data := m.Data

	for y := 0; y < m.Height; y++ {
		for x := 0; x < m.Width; x++ {
			key := fmt.Sprintf("%d,%d", x, y)
			if cell, ok := data[key]; ok {
				style := lipgloss.NewStyle().Foreground(lipgloss.Color(cell.Color))
				if cell.BgColor != "" && cell.BgColor != "transparent" {
					style = style.Background(lipgloss.Color(cell.BgColor))
				}
				sb.WriteString(style.Render(cell.Char))
			} else {
				sb.WriteString(" ")
			}
		}
		sb.WriteString("\n")
	}

	return sb.String()
}

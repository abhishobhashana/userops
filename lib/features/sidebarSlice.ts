import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SidebarState {
  sidebarOpen: boolean;
}

const initialState: SidebarState = {
  sidebarOpen: true,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen } = sidebarSlice.actions;

export default sidebarSlice.reducer;

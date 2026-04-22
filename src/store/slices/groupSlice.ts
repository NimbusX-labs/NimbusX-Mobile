import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GroupState {
  currentGroupId: string | null;
  loading: boolean;
}

const initialState: GroupState = {
  currentGroupId: null,
  loading: false,
};

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setCurrentGroup: (state, action: PayloadAction<string | null>) => {
      state.currentGroupId = action.payload;
    },
    setGroupLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setCurrentGroup, setGroupLoading } = groupSlice.actions;
export default groupSlice.reducer;

import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { User } from '@types';
import { RootState } from '../index';

const userAdapter = createEntityAdapter<User>();

const userSlice = createSlice({
  name: 'users',
  initialState: userAdapter.getInitialState(),
  reducers: {
    upsertUsers: userAdapter.upsertMany,
    upsertUser: userAdapter.upsertOne,
  },
});

export const { upsertUsers, upsertUser } = userSlice.actions;

export const userSelectors = userAdapter.getSelectors<RootState>(
  (state) => state.user
);

export default userSlice.reducer;

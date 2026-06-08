import { cache } from 'react';
import { createClient } from './server';

// 1. Profiles Queries
export const getProfile = cache(async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
});

export async function updateProfile(userId: string, data: any) {
  const supabase = createClient();
  const { data: updated, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

// 2. Events Queries
export const getEvents = cache(async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
});

export async function createEvent(eventData: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEvent(eventId: string, eventData: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
}

// 3. Tasks Queries
export const getTasks = cache(async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
});

export async function createTask(taskData: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, taskData: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

// 4. Notes Queries
export const getNotes = cache(async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
});

export async function createNote(noteData: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notes')
    .insert([noteData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNote(noteId: string, noteData: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notes')
    .update(noteData)
    .eq('id', noteId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNote(noteId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}

// 5. Sermons Queries
export const getSermons = cache(async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sermons')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
});

export async function createSermon(sermonData: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sermons')
    .insert([sermonData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSermon(sermonId: string, sermonData: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sermons')
    .update(sermonData)
    .eq('id', sermonId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSermon(sermonId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('sermons')
    .delete()
    .eq('id', sermonId);

  if (error) throw error;
}

// 6. Financial Records Queries
export const getFinancialEntries = cache(async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('financial_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
});

export async function createFinancialEntry(entryData: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('financial_entries')
    .insert([entryData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFinancialEntry(entryId: string, entryData: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('financial_entries')
    .update(entryData)
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFinancialEntry(entryId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('financial_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
}

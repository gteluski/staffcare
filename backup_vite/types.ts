export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      doctrinal_chunks: {
        Row: {
          category: string
          chunk_index: number
          content: string
          created_at: string
          doc_group: string
          doc_id: string
          doc_title: string
          doc_year: number | null
          embedding: string | null
          fts: unknown
          id: string
          metadata: Json | null
          section: string | null
          tier: number
          tradition: string
        }
        Insert: {
          category?: string
          chunk_index?: number
          content: string
          created_at?: string
          doc_group?: string
          doc_id: string
          doc_title: string
          doc_year?: number | null
          embedding?: string | null
          fts?: unknown
          id?: string
          metadata?: Json | null
          section?: string | null
          tier?: number
          tradition?: string
        }
        Update: {
          category?: string
          chunk_index?: number
          content?: string
          created_at?: string
          doc_group?: string
          doc_id?: string
          doc_title?: string
          doc_year?: number | null
          embedding?: string | null
          fts?: unknown
          id?: string
          metadata?: Json | null
          section?: string | null
          tier?: number
          tradition?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string
          created_at: string
          doc_type: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          doc_type?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          doc_type?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          all_day: boolean
          calendar_context: string
          category: string
          created_at: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          calendar_context?: string
          category?: string
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          calendar_context?: string
          category?: string
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          due_date: string | null
          entry_type: string
          event_id: string | null
          id: string
          paid: boolean
          paid_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          entry_type: string
          event_id?: string | null
          id?: string
          paid?: boolean
          paid_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          entry_type?: string
          event_id?: string | null
          id?: string
          paid?: boolean
          paid_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      library_files: {
        Row: {
          created_at: string
          file_path: string
          file_size: number
          folder_id: string | null
          id: string
          mime_type: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number
          folder_id?: string | null
          id?: string
          mime_type?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number
          folder_id?: string | null
          id?: string
          mime_type?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "library_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      library_folders: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "library_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_history: {
        Row: {
          church_name: string
          city: string
          created_at: string
          end_year: number | null
          id: string
          is_current: boolean
          ministry_function: string
          notes: string | null
          plans: string | null
          reflections: string | null
          start_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          church_name: string
          city: string
          created_at?: string
          end_year?: number | null
          id?: string
          is_current?: boolean
          ministry_function: string
          notes?: string | null
          plans?: string | null
          reflections?: string | null
          start_year: number
          updated_at?: string
          user_id: string
        }
        Update: {
          church_name?: string
          city?: string
          created_at?: string
          end_year?: number | null
          id?: string
          is_current?: boolean
          ministry_function?: string
          notes?: string | null
          plans?: string | null
          reflections?: string | null
          start_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ministry_plans: {
        Row: {
          commitments: string | null
          created_at: string
          family_rest: string | null
          focus: string | null
          goals: string | null
          id: string
          month: string | null
          next_steps: string | null
          observations: string | null
          plan_type: string
          prayer_devotional: string | null
          preaching_studies: string | null
          priorities: string | null
          reflection: string | null
          title: string | null
          updated_at: string
          user_id: string
          visits_discipleship: string | null
          week_start: string | null
        }
        Insert: {
          commitments?: string | null
          created_at?: string
          family_rest?: string | null
          focus?: string | null
          goals?: string | null
          id?: string
          month?: string | null
          next_steps?: string | null
          observations?: string | null
          plan_type?: string
          prayer_devotional?: string | null
          preaching_studies?: string | null
          priorities?: string | null
          reflection?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          visits_discipleship?: string | null
          week_start?: string | null
        }
        Update: {
          commitments?: string | null
          created_at?: string
          family_rest?: string | null
          focus?: string | null
          goals?: string | null
          id?: string
          month?: string | null
          next_steps?: string | null
          observations?: string | null
          plan_type?: string
          prayer_devotional?: string | null
          preaching_studies?: string | null
          priorities?: string | null
          reflection?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          visits_discipleship?: string | null
          week_start?: string | null
        }
        Relationships: []
      }
      missionary_trips: {
        Row: {
          church_community: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          location: string
          notes: string | null
          results: string | null
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          church_community?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string
          notes?: string | null
          results?: string | null
          start_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          church_community?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string
          notes?: string | null
          results?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_settings: {
        Row: {
          created_at: string
          id: string
          must_change_password: boolean
          onboarding_completed: boolean
          storage_quota_mb: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          must_change_password?: boolean
          onboarding_completed?: boolean
          storage_quota_mb?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          must_change_password?: boolean
          onboarding_completed?: boolean
          storage_quota_mb?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          church_name: string | null
          created_at: string
          district: string | null
          full_name: string | null
          id: string
          pastoral_title: string | null
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          church_name?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id: string
          pastoral_title?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          church_name?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id?: string
          pastoral_title?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rls_audit_runs: {
        Row: {
          created_at: string
          critical_failures: number
          executor_email: string | null
          executor_user_id: string | null
          id: string
          notes: string | null
          ran_at: string
          safe_mode: boolean
          snapshot: Json
          total_fail: number
          total_pass: number
          total_pending: number
          total_skipped: number
          total_warn: number
        }
        Insert: {
          created_at?: string
          critical_failures?: number
          executor_email?: string | null
          executor_user_id?: string | null
          id?: string
          notes?: string | null
          ran_at?: string
          safe_mode?: boolean
          snapshot?: Json
          total_fail?: number
          total_pass?: number
          total_pending?: number
          total_skipped?: number
          total_warn?: number
        }
        Update: {
          created_at?: string
          critical_failures?: number
          executor_email?: string | null
          executor_user_id?: string | null
          id?: string
          notes?: string | null
          ran_at?: string
          safe_mode?: boolean
          snapshot?: Json
          total_fail?: number
          total_pass?: number
          total_pending?: number
          total_skipped?: number
          total_warn?: number
        }
        Relationships: []
      }
      sermons: {
        Row: {
          bible_text: string | null
          church_name: string | null
          created_at: string
          id: string
          location_type: string
          main_points: string | null
          notes: string | null
          series_name: string | null
          sermon_date: string | null
          speech_highlights: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bible_text?: string | null
          church_name?: string | null
          created_at?: string
          id?: string
          location_type?: string
          main_points?: string | null
          notes?: string | null
          series_name?: string | null
          sermon_date?: string | null
          speech_highlights?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bible_text?: string | null
          church_name?: string | null
          created_at?: string
          id?: string
          location_type?: string
          main_points?: string | null
          notes?: string | null
          series_name?: string | null
          sermon_date?: string | null
          speech_highlights?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spiritual_experiences: {
        Row: {
          created_at: string
          experience_date: string | null
          experience_text: string | null
          id: string
          prayer_notes: string | null
          title: string
          updated_at: string
          user_id: string
          words_from_god: string | null
        }
        Insert: {
          created_at?: string
          experience_date?: string | null
          experience_text?: string | null
          id?: string
          prayer_notes?: string | null
          title: string
          updated_at?: string
          user_id: string
          words_from_god?: string | null
        }
        Update: {
          created_at?: string
          experience_date?: string | null
          experience_text?: string | null
          id?: string
          prayer_notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          words_from_god?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          activated_at: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          notes: string | null
          paid_until: string | null
          payment_method: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_end: string
          trial_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          notes?: string | null
          paid_until?: string | null
          payment_method?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_end?: string
          trial_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          notes?: string | null
          paid_until?: string | null
          payment_method?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_end?: string
          trial_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          due_date: string | null
          event_id: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          environment: string
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          payload_summary: Json | null
          processed_at: string | null
          provider: string
          received_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          environment?: string
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          payload_summary?: Json | null
          processed_at?: string | null
          provider?: string
          received_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          environment?: string
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          payload_summary?: Json | null
          processed_at?: string | null
          provider?: string
          received_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_storage_usage: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_doctrinal_chunks: {
        Args: {
          filter_category?: string
          filter_tradition?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          doc_id: string
          doc_title: string
          id: string
          section: string
          similarity: number
          tier: number
          tradition: string
        }[]
      }
      search_doctrinal_chunks: {
        Args: {
          filter_category?: string
          filter_tradition?: string
          include_comparative?: boolean
          max_results?: number
          search_query: string
        }
        Returns: {
          category: string
          content: string
          doc_id: string
          doc_title: string
          id: string
          rank: number
          section: string
          tier: number
          tradition: string
        }[]
      }
    }
    Enums: {
      app_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin"],
    },
  },
} as const

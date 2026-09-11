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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          additional_comments: string | null
          created_at: string
          flagged_by_user_id: string
          id: string
          reason: string
          report_id: string
          status: string
          updated_at: string
        }
        Insert: {
          additional_comments?: string | null
          created_at?: string
          flagged_by_user_id: string
          id?: string
          reason: string
          report_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          additional_comments?: string | null
          created_at?: string
          flagged_by_user_id?: string
          id?: string
          reason?: string
          report_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      actions_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          payload: Json | null
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          payload?: Json | null
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          payload?: Json | null
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      analytics_summary: {
        Row: {
          active_users: number
          avg_attention_time_minutes: number | null
          created_at: string
          date: string
          id: string
          total_reports: number
          total_taps: number
          total_views: number
          updated_at: string
        }
        Insert: {
          active_users?: number
          avg_attention_time_minutes?: number | null
          created_at?: string
          date: string
          id?: string
          total_reports?: number
          total_taps?: number
          total_views?: number
          updated_at?: string
        }
        Update: {
          active_users?: number
          avg_attention_time_minutes?: number | null
          created_at?: string
          date?: string
          id?: string
          total_reports?: number
          total_taps?: number
          total_views?: number
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      city_admins: {
        Row: {
          admin_name: string
          assigned_city: string
          created_at: string
          email: string
          id: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_name: string
          assigned_city: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_name?: string
          assigned_city?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      civic_modules: {
        Row: {
          city: string | null
          created_at: string
          department_tag: string | null
          description: string | null
          file_type: string
          file_url: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          department_tag?: string | null
          description?: string | null
          file_type: string
          file_url: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          city?: string | null
          created_at?: string
          department_tag?: string | null
          description?: string | null
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      download_logs: {
        Row: {
          created_at: string
          download_url: string | null
          format: string
          id: string
          resolution: string
          user_id: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          format: string
          id?: string
          resolution: string
          user_id?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          format?: string
          id?: string
          resolution?: string
          user_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_logs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component: string
          created_at: string
          error_type: string
          id: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          timestamp: string
          updated_at: string
        }
        Insert: {
          component: string
          created_at?: string
          error_type: string
          id?: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string
          timestamp?: string
          updated_at?: string
        }
        Update: {
          component?: string
          created_at?: string
          error_type?: string
          id?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_toggles: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string
          id: string
          is_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      government_users: {
        Row: {
          created_at: string
          designation: string
          full_name: string
          government_id_url: string | null
          id: string
          region_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          designation: string
          full_name: string
          government_id_url?: string | null
          id?: string
          region_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          designation?: string
          full_name?: string
          government_id_url?: string | null
          id?: string
          region_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "government_users_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          abuse_report_feedback: boolean
          comment_alerts: boolean
          community_updates: boolean
          created_at: string
          delivery_method: string
          id: string
          nearby_alerts: boolean
          nearby_radius_km: number
          reply_notifications: boolean
          report_updates: boolean
          resolution_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          abuse_report_feedback?: boolean
          comment_alerts?: boolean
          community_updates?: boolean
          created_at?: string
          delivery_method?: string
          id?: string
          nearby_alerts?: boolean
          nearby_radius_km?: number
          reply_notifications?: boolean
          report_updates?: boolean
          resolution_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          abuse_report_feedback?: boolean
          comment_alerts?: boolean
          community_updates?: boolean
          created_at?: string
          delivery_method?: string
          id?: string
          nearby_alerts?: boolean
          nearby_radius_km?: number
          reply_notifications?: boolean
          report_updates?: boolean
          resolution_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          delivery_status: string
          id: string
          is_read: boolean
          priority: string
          recipient_role: string | null
          sent_by: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          delivery_status?: string
          id?: string
          is_read?: boolean
          priority?: string
          recipient_role?: string | null
          sent_by?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          delivery_status?: string
          id?: string
          is_read?: boolean
          priority?: string
          recipient_role?: string | null
          sent_by?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          code: string
          created_at: string
          district: string | null
          id: string
          name: string
          state: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          district?: string | null
          id?: string
          name: string
          state: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          district?: string | null
          id?: string
          name?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_attention: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          attention_time_minutes: number | null
          created_at: string
          id: string
          report_id: string
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          attention_time_minutes?: number | null
          created_at?: string
          id?: string
          report_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          attention_time_minutes?: number | null
          created_at?: string
          id?: string
          report_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_attention_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_attention_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_attention_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      report_flags: {
        Row: {
          created_at: string
          flag_type: string
          flagged_by_user_id: string | null
          id: string
          is_auto_flagged: boolean
          reason: string | null
          report_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flag_type: string
          flagged_by_user_id?: string | null
          id?: string
          is_auto_flagged?: boolean
          reason?: string | null
          report_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flag_type?: string
          flagged_by_user_id?: string | null
          id?: string
          is_auto_flagged?: boolean
          reason?: string | null
          report_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_anonymous: boolean
          issue_type: string
          latitude: number
          longitude: number
          media_url: string
          region_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_image_url: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_anonymous?: boolean
          issue_type?: string
          latitude: number
          longitude: number
          media_url: string
          region_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_image_url?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_anonymous?: boolean
          issue_type?: string
          latitude?: number
          longitude?: number
          media_url?: string
          region_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_image_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          is_granted: boolean
          permission_key: string
          role_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_granted?: boolean
          permission_key: string
          role_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_granted?: boolean
          permission_key?: string
          role_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      settings_audit: {
        Row: {
          action_type: string
          admin_id: string
          changes_summary: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action_type: string
          admin_id: string
          changes_summary?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          changes_summary?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      share_logs: {
        Row: {
          created_at: string
          id: string
          method: string
          report_id: string
          shared_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          method: string
          report_id: string
          shared_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          method?: string
          report_id?: string
          shared_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_logs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          timestamp: string
          unit: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          timestamp?: string
          unit: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          timestamp?: string
          unit?: string
          value?: number
        }
        Relationships: []
      }
      taps: {
        Row: {
          created_at: string
          device_type: string
          element_type: string
          feature: string
          id: string
          metadata: Json | null
          page_path: string | null
          session_id: string | null
          tapped_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string
          element_type?: string
          feature: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          tapped_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string
          element_type?: string
          feature?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          tapped_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          resolutions: string[]
          status: string
          type: string
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          resolutions?: string[]
          status?: string
          type: string
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          resolutions?: string[]
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          ip_hash: string | null
          is_active: boolean
          last_seen_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          ip_hash?: string | null
          is_active?: boolean
          last_seen_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          ip_hash?: string | null
          is_active?: boolean
          last_seen_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_status: {
        Row: {
          created_at: string
          id: string
          reasons: string[] | null
          status: string
          strike_count: number
          suspension_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reasons?: string[] | null
          status?: string
          strike_count?: number
          suspension_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reasons?: string[] | null
          status?: string
          strike_count?: number
          suspension_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_status_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          allow_email_contact: boolean | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_anonymous: boolean
          name: string
          notify_comments: boolean | null
          notify_resolved: boolean | null
          notify_trending: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          show_name_publicly: boolean | null
          updated_at: string
          username: string | null
        }
        Insert: {
          allow_email_contact?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_anonymous?: boolean
          name: string
          notify_comments?: boolean | null
          notify_resolved?: boolean | null
          notify_trending?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          show_name_publicly?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          allow_email_contact?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_anonymous?: boolean
          name?: string
          notify_comments?: boolean | null
          notify_resolved?: boolean | null
          notify_trending?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          show_name_publicly?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          channel_logo_url: string | null
          channel_name: string
          created_at: string
          description: string | null
          duration: string
          fetched_by_user_id: string | null
          format: string
          id: string
          resolutions: string[] | null
          tags: string[] | null
          thumbnail_url: string
          title: string
          type: string
          updated_at: string
          video_id: string
        }
        Insert: {
          channel_logo_url?: string | null
          channel_name: string
          created_at?: string
          description?: string | null
          duration: string
          fetched_by_user_id?: string | null
          format?: string
          id?: string
          resolutions?: string[] | null
          tags?: string[] | null
          thumbnail_url: string
          title: string
          type?: string
          updated_at?: string
          video_id: string
        }
        Update: {
          channel_logo_url?: string | null
          channel_name?: string
          created_at?: string
          description?: string | null
          duration?: string
          fetched_by_user_id?: string | null
          format?: string
          id?: string
          resolutions?: string[] | null
          tags?: string[] | null
          thumbnail_url?: string
          title?: string
          type?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: []
      }
      views: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          device_type: string
          id: string
          page_path: string | null
          session_id: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          content_id: string
          content_type?: string
          created_at?: string
          device_type?: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          device_type?: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          anon_id?: string | null
          created_at: string
          id: string
          report_id: string
          user_id: string | null
        }
        Insert: {
          anon_id?: string | null
          created_at?: string
          id?: string
          report_id: string
          user_id?: string | null
        }
        Update: {
          anon_id?: string | null
          created_at?: string
          id?: string
          report_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_safe_distance: {
        Args: { report_id: string; user_lat: number; user_lng: number }
        Returns: number
      }
      fuzz_coordinates: {
        Args: { lat: number; lng: number; radius_meters?: number }
        Returns: Json
      }
      get_abuse_report_count: { Args: { report_id: string }; Returns: number }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_public_profiles: {
        Args: { user_ids: string[] }
        Returns: {
          avatar_url: string
          id: string
          name: string
          username: string
        }[]
      }
      get_safe_reports: {
        Args: { user_region_id?: string; user_role?: string }
        Returns: {
          created_at: string
          description: string
          id: string
          is_anonymous: boolean
          is_approximate: boolean
          issue_type: string
          latitude: number
          longitude: number
          media_url: string
          region_id: string
          resolved_at: string
          resolved_by: string
          resolved_image_url: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }[]
      }
      get_share_count: { Args: { report_id: string }; Returns: number }
      get_top_reporters_public: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          name: string
          report_count: number
          user_id: string
          username: string
        }[]
      }
      get_top_voted_reports: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          media_url: string
          title: string
          vote_count: number
        }[]
      }
      get_vote_count: { Args: { report_id: string }; Returns: number }
      get_vote_counts: {
        Args: { report_ids: string[] }
        Returns: {
          report_id: string
          vote_count: number
        }[]
      }
      user_has_reported_abuse: {
        Args: { report_id: string; user_id: string }
        Returns: boolean
      }
      user_has_voted: {
        Args: { report_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "user" | "admin" | "superadmin" | "government" | "banned"
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
      user_role: ["user", "admin", "superadmin", "government", "banned"],
    },
  },
} as const

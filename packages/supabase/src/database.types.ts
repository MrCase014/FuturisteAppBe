/**
 * ⚙️ FICHIER GÉNÉRÉ — ne pas éditer à la main, il serait écrasé.
 * Source : le schéma PostgreSQL. Régénérer après toute migration :
 *   pnpm db:types
 *
 * 42 tables · 6 vues · 15 types énumérés.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      academies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          country: string | null;
          city: string | null;
          logo_url: string | null;
          primary_color: string | null;
          default_locale: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          slug: string;
          country?: string | null;
          city?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          default_locale?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          country?: string | null;
          city?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          default_locale?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      academy_settings: {
        Row: {
          academy_id: string;
          settings: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          academy_id: string;
          settings?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          academy_id?: string;
          settings?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      age_groups: {
        Row: {
          id: string;
          academy_id: string;
          code: string;
          label_fr: string;
          label_en: string | null;
          min_age: number;
          max_age: number;
          order_index: number;
          objectives: string | null;
          priority_competencies: string[];
          session_duration_min: number;
          sessions_per_week: number;
          complexity_level: number;
          physical_guidelines: string | null;
          content_technical: string | null;
          content_tactical: string | null;
          content_cognitive: string | null;
          content_mental: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          code: string;
          label_fr: string;
          label_en?: string | null;
          min_age: number;
          max_age: number;
          order_index: number;
          objectives?: string | null;
          priority_competencies?: string[];
          session_duration_min?: number;
          sessions_per_week?: number;
          complexity_level?: number;
          physical_guidelines?: string | null;
          content_technical?: string | null;
          content_tactical?: string | null;
          content_cognitive?: string | null;
          content_mental?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          code?: string;
          label_fr?: string;
          label_en?: string | null;
          min_age?: number;
          max_age?: number;
          order_index?: number;
          objectives?: string | null;
          priority_competencies?: string[];
          session_duration_min?: number;
          sessions_per_week?: number;
          complexity_level?: number;
          physical_guidelines?: string | null;
          content_technical?: string | null;
          content_tactical?: string | null;
          content_cognitive?: string | null;
          content_mental?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_requests: {
        Row: {
          id: string;
          academy_id: string;
          actor_id: string | null;
          kind: string;
          input: Json;
          output: Json | null;
          model: string | null;
          tokens_in: number | null;
          tokens_out: number | null;
          cost_usd: number | null;
          status: string;
          error: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          academy_id: string;
          actor_id?: string | null;
          kind: string;
          input: Json;
          output?: Json | null;
          model?: string | null;
          tokens_in?: number | null;
          tokens_out?: number | null;
          cost_usd?: number | null;
          status?: string;
          error?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          academy_id?: string;
          actor_id?: string | null;
          kind?: string;
          input?: Json;
          output?: Json | null;
          model?: string | null;
          tokens_in?: number | null;
          tokens_out?: number | null;
          cost_usd?: number | null;
          status?: string;
          error?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      announcements: {
        Row: {
          id: string;
          academy_id: string;
          team_id: string | null;
          author_id: string | null;
          title: string;
          body: string;
          audience: string;
          is_pinned: boolean;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          team_id?: string | null;
          author_id?: string | null;
          title: string;
          body: string;
          audience?: string;
          is_pinned?: boolean;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          team_id?: string | null;
          author_id?: string | null;
          title?: string;
          body?: string;
          audience?: string;
          is_pinned?: boolean;
          published_at?: string | null;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          event_id: string;
          player_id: string;
          status: Database['public']['Enums']['attendance_status'];
          minutes_late: number;
          reason: string | null;
          recorded_by: string | null;
          recorded_at: string;
          client_generated_id: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          player_id: string;
          status: Database['public']['Enums']['attendance_status'];
          minutes_late?: number;
          reason?: string | null;
          recorded_by?: string | null;
          recorded_at?: string;
          client_generated_id?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          player_id?: string;
          status?: Database['public']['Enums']['attendance_status'];
          minutes_late?: number;
          reason?: string | null;
          recorded_by?: string | null;
          recorded_at?: string;
          client_generated_id?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          academy_id: string | null;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          diff: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          academy_id?: string | null;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          diff?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string | null;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          diff?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      badges: {
        Row: {
          id: string;
          academy_id: string;
          code: string;
          name_fr: string;
          name_en: string | null;
          emoji: string | null;
          domain_id: string | null;
          description: string | null;
          criteria: Json;
          tier: number;
          is_automatic: boolean;
        };
        Insert: {
          id?: string;
          academy_id: string;
          code: string;
          name_fr: string;
          name_en?: string | null;
          emoji?: string | null;
          domain_id?: string | null;
          description?: string | null;
          criteria?: Json;
          tier?: number;
          is_automatic?: boolean;
        };
        Update: {
          id?: string;
          academy_id?: string;
          code?: string;
          name_fr?: string;
          name_en?: string | null;
          emoji?: string | null;
          domain_id?: string | null;
          description?: string | null;
          criteria?: Json;
          tier?: number;
          is_automatic?: boolean;
        };
      };
      challenges: {
        Row: {
          id: string;
          academy_id: string;
          title: string;
          description: string | null;
          domain_id: string | null;
          age_group_ids: string[];
          video_url: string | null;
          duration_days: number;
          points: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          academy_id: string;
          title: string;
          description?: string | null;
          domain_id?: string | null;
          age_group_ids?: string[];
          video_url?: string | null;
          duration_days?: number;
          points?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          academy_id?: string;
          title?: string;
          description?: string | null;
          domain_id?: string | null;
          age_group_ids?: string[];
          video_url?: string | null;
          duration_days?: number;
          points?: number;
          is_active?: boolean;
        };
      };
      competencies: {
        Row: {
          id: string;
          academy_id: string;
          domain_id: string;
          code: string;
          name_fr: string;
          name_en: string | null;
          description: string | null;
          observable_behaviour: string | null;
          min_age: number;
          max_age: number;
          order_index: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          domain_id: string;
          code: string;
          name_fr: string;
          name_en?: string | null;
          description?: string | null;
          observable_behaviour?: string | null;
          min_age?: number;
          max_age?: number;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          domain_id?: string;
          code?: string;
          name_fr?: string;
          name_en?: string | null;
          description?: string | null;
          observable_behaviour?: string | null;
          min_age?: number;
          max_age?: number;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      competency_levels: {
        Row: {
          id: string;
          competency_id: string | null;
          level: number;
          label_fr: string;
          label_en: string | null;
          descriptor: string | null;
        };
        Insert: {
          id?: string;
          competency_id?: string | null;
          level: number;
          label_fr: string;
          label_en?: string | null;
          descriptor?: string | null;
        };
        Update: {
          id?: string;
          competency_id?: string | null;
          level?: number;
          label_fr?: string;
          label_en?: string | null;
          descriptor?: string | null;
        };
      };
      development_domains: {
        Row: {
          id: string;
          academy_id: string;
          code: string;
          name_fr: string;
          name_en: string | null;
          description: string | null;
          color: string;
          icon: string | null;
          order_index: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          academy_id: string;
          code: string;
          name_fr: string;
          name_en?: string | null;
          description?: string | null;
          color: string;
          icon?: string | null;
          order_index: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          academy_id?: string;
          code?: string;
          name_fr?: string;
          name_en?: string | null;
          description?: string | null;
          color?: string;
          icon?: string | null;
          order_index?: number;
          is_active?: boolean;
        };
      };
      events: {
        Row: {
          id: string;
          academy_id: string;
          team_id: string | null;
          type: Database['public']['Enums']['event_type'];
          session_id: string | null;
          match_id: string | null;
          title: string;
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          team_id?: string | null;
          type: Database['public']['Enums']['event_type'];
          session_id?: string | null;
          match_id?: string | null;
          title: string;
          starts_at: string;
          ends_at?: string | null;
          location?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          team_id?: string | null;
          type?: Database['public']['Enums']['event_type'];
          session_id?: string | null;
          match_id?: string | null;
          title?: string;
          starts_at?: string;
          ends_at?: string | null;
          location?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      exercise_diagrams: {
        Row: {
          id: string;
          academy_id: string;
          exercise_id: string | null;
          title: string | null;
          canvas: Json;
          version: number;
          preview_url: string | null;
          order_index: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          exercise_id?: string | null;
          title?: string | null;
          canvas: Json;
          version?: number;
          preview_url?: string | null;
          order_index?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          exercise_id?: string | null;
          title?: string | null;
          canvas?: Json;
          version?: number;
          preview_url?: string | null;
          order_index?: number;
          created_by?: string | null;
          created_at?: string;
        };
      };
      exercise_media: {
        Row: {
          id: string;
          academy_id: string;
          exercise_id: string | null;
          session_id: string | null;
          kind: string;
          provider: Database['public']['Enums']['media_provider'];
          storage_path: string | null;
          external_id: string | null;
          url: string | null;
          thumbnail_url: string | null;
          title: string | null;
          duration_sec: number | null;
          size_bytes: number | null;
          age_group_ids: string[];
          theme: string | null;
          language: string;
          contains_minors: boolean;
          order_index: number;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          exercise_id?: string | null;
          session_id?: string | null;
          kind: string;
          provider?: Database['public']['Enums']['media_provider'];
          storage_path?: string | null;
          external_id?: string | null;
          url?: string | null;
          thumbnail_url?: string | null;
          title?: string | null;
          duration_sec?: number | null;
          size_bytes?: number | null;
          age_group_ids?: string[];
          theme?: string | null;
          language?: string;
          contains_minors?: boolean;
          order_index?: number;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          exercise_id?: string | null;
          session_id?: string | null;
          kind?: string;
          provider?: Database['public']['Enums']['media_provider'];
          storage_path?: string | null;
          external_id?: string | null;
          url?: string | null;
          thumbnail_url?: string | null;
          title?: string | null;
          duration_sec?: number | null;
          size_bytes?: number | null;
          age_group_ids?: string[];
          theme?: string | null;
          language?: string;
          contains_minors?: boolean;
          order_index?: number;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          academy_id: string;
          name: string;
          slug: string;
          objective: string;
          domain_id: string | null;
          competency_ids: string[];
          age_group_ids: string[];
          min_age: number | null;
          max_age: number | null;
          level: Database['public']['Enums']['exercise_level'];
          default_phase: Database['public']['Enums']['session_phase'] | null;
          duration_min: number;
          players_min: number;
          players_max: number;
          goalkeepers: number;
          equipment: Json;
          area_length_m: number | null;
          area_width_m: number | null;
          description: string;
          coach_instructions: string | null;
          observation_points: string[];
          common_mistakes: string[];
          variations: string[];
          progression: string | null;
          regression: string | null;
          intensity: number | null;
          cognitive_load: number | null;
          is_published: boolean;
          usage_count: number;
          created_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          name: string;
          slug: string;
          objective: string;
          domain_id?: string | null;
          competency_ids?: string[];
          age_group_ids?: string[];
          min_age?: number | null;
          max_age?: number | null;
          level?: Database['public']['Enums']['exercise_level'];
          default_phase?: Database['public']['Enums']['session_phase'] | null;
          duration_min: number;
          players_min: number;
          players_max: number;
          goalkeepers?: number;
          equipment?: Json;
          area_length_m?: number | null;
          area_width_m?: number | null;
          description: string;
          coach_instructions?: string | null;
          observation_points?: string[];
          common_mistakes?: string[];
          variations?: string[];
          progression?: string | null;
          regression?: string | null;
          intensity?: number | null;
          cognitive_load?: number | null;
          is_published?: boolean;
          usage_count?: number;
          created_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          name?: string;
          slug?: string;
          objective?: string;
          domain_id?: string | null;
          competency_ids?: string[];
          age_group_ids?: string[];
          min_age?: number | null;
          max_age?: number | null;
          level?: Database['public']['Enums']['exercise_level'];
          default_phase?: Database['public']['Enums']['session_phase'] | null;
          duration_min?: number;
          players_min?: number;
          players_max?: number;
          goalkeepers?: number;
          equipment?: Json;
          area_length_m?: number | null;
          area_width_m?: number | null;
          description?: string;
          coach_instructions?: string | null;
          observation_points?: string[];
          common_mistakes?: string[];
          variations?: string[];
          progression?: string | null;
          regression?: string | null;
          intensity?: number | null;
          cognitive_load?: number | null;
          is_published?: boolean;
          usage_count?: number;
          created_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      family_resources: {
        Row: {
          id: string;
          academy_id: string;
          category: string;
          title_fr: string;
          title_en: string | null;
          body_fr: string | null;
          body_en: string | null;
          media_url: string | null;
          age_group_ids: string[];
          is_published: boolean;
          order_index: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          category: string;
          title_fr: string;
          title_en?: string | null;
          body_fr?: string | null;
          body_en?: string | null;
          media_url?: string | null;
          age_group_ids?: string[];
          is_published?: boolean;
          order_index?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          category?: string;
          title_fr?: string;
          title_en?: string | null;
          body_fr?: string | null;
          body_en?: string | null;
          media_url?: string | null;
          age_group_ids?: string[];
          is_published?: boolean;
          order_index?: number;
          updated_at?: string;
        };
      };
      match_events: {
        Row: {
          id: string;
          match_id: string;
          player_id: string | null;
          related_player_id: string | null;
          type: Database['public']['Enums']['match_event_type'];
          minute: number | null;
          pitch_x: number | null;
          pitch_y: number | null;
          notes: string | null;
          recorded_by: string | null;
          client_generated_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id?: string | null;
          related_player_id?: string | null;
          type: Database['public']['Enums']['match_event_type'];
          minute?: number | null;
          pitch_x?: number | null;
          pitch_y?: number | null;
          notes?: string | null;
          recorded_by?: string | null;
          client_generated_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string | null;
          related_player_id?: string | null;
          type?: Database['public']['Enums']['match_event_type'];
          minute?: number | null;
          pitch_x?: number | null;
          pitch_y?: number | null;
          notes?: string | null;
          recorded_by?: string | null;
          client_generated_id?: string | null;
          created_at?: string;
        };
      };
      match_players: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          is_starter: boolean;
          position: string | null;
          minutes_played: number;
          comment: string | null;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          is_starter?: boolean;
          position?: string | null;
          minutes_played?: number;
          comment?: string | null;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          is_starter?: boolean;
          position?: string | null;
          minutes_played?: number;
          comment?: string | null;
        };
      };
      matches: {
        Row: {
          id: string;
          academy_id: string;
          team_id: string;
          opponent: string;
          kickoff_at: string;
          venue: string | null;
          is_home: boolean;
          competition: string | null;
          score_for: number | null;
          score_against: number | null;
          formation: string | null;
          status: string;
          coach_report: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          team_id: string;
          opponent: string;
          kickoff_at: string;
          venue?: string | null;
          is_home?: boolean;
          competition?: string | null;
          score_for?: number | null;
          score_against?: number | null;
          formation?: string | null;
          status?: string;
          coach_report?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          team_id?: string;
          opponent?: string;
          kickoff_at?: string;
          venue?: string | null;
          is_home?: boolean;
          competition?: string | null;
          score_for?: number | null;
          score_against?: number | null;
          formation?: string | null;
          status?: string;
          coach_report?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      methodology: {
        Row: {
          id: string;
          academy_id: string;
          age_group_id: string | null;
          domain_id: string | null;
          section: string;
          title_fr: string;
          title_en: string | null;
          body_fr: string | null;
          body_en: string | null;
          order_index: number;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          age_group_id?: string | null;
          domain_id?: string | null;
          section: string;
          title_fr: string;
          title_en?: string | null;
          body_fr?: string | null;
          body_en?: string | null;
          order_index?: number;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          age_group_id?: string | null;
          domain_id?: string | null;
          section?: string;
          title_fr?: string;
          title_en?: string | null;
          body_fr?: string | null;
          body_en?: string | null;
          order_index?: number;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          title: string;
          body: string | null;
          data: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: string;
          title: string;
          body?: string | null;
          data?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          data?: Json;
          read_at?: string | null;
          created_at?: string;
        };
      };
      player_badges: {
        Row: {
          id: string;
          player_id: string;
          badge_id: string;
          awarded_by: string | null;
          reason: string | null;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          badge_id: string;
          awarded_by?: string | null;
          reason?: string | null;
          awarded_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          badge_id?: string;
          awarded_by?: string | null;
          reason?: string | null;
          awarded_at?: string;
        };
      };
      player_challenges: {
        Row: {
          id: string;
          player_id: string;
          challenge_id: string;
          status: string;
          submitted_media_url: string | null;
          validated_by: string | null;
          validated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          challenge_id: string;
          status?: string;
          submitted_media_url?: string | null;
          validated_by?: string | null;
          validated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          challenge_id?: string;
          status?: string;
          submitted_media_url?: string | null;
          validated_by?: string | null;
          validated_at?: string | null;
          created_at?: string;
        };
      };
      player_development_snapshots: {
        Row: {
          id: string;
          player_id: string;
          domain_id: string;
          period: string;
          avg_level: number | null;
          sample_size: number | null;
          computed_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          domain_id: string;
          period: string;
          avg_level?: number | null;
          sample_size?: number | null;
          computed_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          domain_id?: string;
          period?: string;
          avg_level?: number | null;
          sample_size?: number | null;
          computed_at?: string;
        };
      };
      player_dna_profiles: {
        Row: {
          id: string;
          player_id: string;
          primary_archetype: Database['public']['Enums']['player_archetype'] | null;
          secondary_archetype: Database['public']['Enums']['player_archetype'] | null;
          scores: Json;
          confidence: number;
          is_manual_override: boolean;
          computed_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          primary_archetype?: Database['public']['Enums']['player_archetype'] | null;
          secondary_archetype?: Database['public']['Enums']['player_archetype'] | null;
          scores?: Json;
          confidence?: number;
          is_manual_override?: boolean;
          computed_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          primary_archetype?: Database['public']['Enums']['player_archetype'] | null;
          secondary_archetype?: Database['public']['Enums']['player_archetype'] | null;
          scores?: Json;
          confidence?: number;
          is_manual_override?: boolean;
          computed_at?: string;
        };
      };
      player_evaluation_scores: {
        Row: {
          id: string;
          evaluation_id: string;
          competency_id: string;
          level: number;
          comment: string | null;
        };
        Insert: {
          id?: string;
          evaluation_id: string;
          competency_id: string;
          level: number;
          comment?: string | null;
        };
        Update: {
          id?: string;
          evaluation_id?: string;
          competency_id?: string;
          level?: number;
          comment?: string | null;
        };
      };
      player_evaluations: {
        Row: {
          id: string;
          academy_id: string;
          player_id: string;
          session_id: string | null;
          match_id: string | null;
          evaluator_id: string;
          context: Database['public']['Enums']['evaluation_context'];
          evaluated_at: string;
          engagement: number | null;
          effort: number | null;
          behaviour: number | null;
          session_objective_reached: boolean | null;
          qualitative_comment: string | null;
          is_visible_to_parent: boolean;
          is_visible_to_player: boolean;
          client_generated_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          player_id: string;
          session_id?: string | null;
          match_id?: string | null;
          evaluator_id: string;
          context?: Database['public']['Enums']['evaluation_context'];
          evaluated_at?: string;
          engagement?: number | null;
          effort?: number | null;
          behaviour?: number | null;
          session_objective_reached?: boolean | null;
          qualitative_comment?: string | null;
          is_visible_to_parent?: boolean;
          is_visible_to_player?: boolean;
          client_generated_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          player_id?: string;
          session_id?: string | null;
          match_id?: string | null;
          evaluator_id?: string;
          context?: Database['public']['Enums']['evaluation_context'];
          evaluated_at?: string;
          engagement?: number | null;
          effort?: number | null;
          behaviour?: number | null;
          session_objective_reached?: boolean | null;
          qualitative_comment?: string | null;
          is_visible_to_parent?: boolean;
          is_visible_to_player?: boolean;
          client_generated_id?: string | null;
          created_at?: string;
        };
      };
      player_goal_checkins: {
        Row: {
          id: string;
          goal_id: string;
          session_id: string | null;
          rating: number | null;
          comment: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          session_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          session_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      player_goals: {
        Row: {
          id: string;
          academy_id: string;
          player_id: string;
          competency_id: string | null;
          title: string;
          description: string | null;
          status: Database['public']['Enums']['goal_status'];
          progress_pct: number;
          start_level: number | null;
          target_level: number | null;
          target_date: string | null;
          source_evaluation_id: string | null;
          created_by: string | null;
          achieved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          player_id: string;
          competency_id?: string | null;
          title: string;
          description?: string | null;
          status?: Database['public']['Enums']['goal_status'];
          progress_pct?: number;
          start_level?: number | null;
          target_level?: number | null;
          target_date?: string | null;
          source_evaluation_id?: string | null;
          created_by?: string | null;
          achieved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          player_id?: string;
          competency_id?: string | null;
          title?: string;
          description?: string | null;
          status?: Database['public']['Enums']['goal_status'];
          progress_pct?: number;
          start_level?: number | null;
          target_level?: number | null;
          target_date?: string | null;
          source_evaluation_id?: string | null;
          created_by?: string | null;
          achieved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      player_guardians: {
        Row: {
          id: string;
          player_id: string;
          guardian_id: string;
          relationship: string | null;
          is_primary: boolean;
          consent_data_at: string | null;
          consent_media_at: string | null;
          consent_medical_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          guardian_id: string;
          relationship?: string | null;
          is_primary?: boolean;
          consent_data_at?: string | null;
          consent_media_at?: string | null;
          consent_medical_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          guardian_id?: string;
          relationship?: string | null;
          is_primary?: boolean;
          consent_data_at?: string | null;
          consent_media_at?: string | null;
          consent_medical_at?: string | null;
          created_at?: string;
        };
      };
      player_statistics: {
        Row: {
          id: string;
          player_id: string;
          season: string;
          matches_played: number;
          minutes_played: number;
          goals: number;
          assists: number;
          shots: number;
          recoveries: number;
          losses: number;
          duels_won: number;
          duels_lost: number;
          attendance_rate: number | null;
          sessions_attended: number;
          sessions_total: number;
          computed_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          season: string;
          matches_played?: number;
          minutes_played?: number;
          goals?: number;
          assists?: number;
          shots?: number;
          recoveries?: number;
          losses?: number;
          duels_won?: number;
          duels_lost?: number;
          attendance_rate?: number | null;
          sessions_attended?: number;
          sessions_total?: number;
          computed_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          season?: string;
          matches_played?: number;
          minutes_played?: number;
          goals?: number;
          assists?: number;
          shots?: number;
          recoveries?: number;
          losses?: number;
          duels_won?: number;
          duels_lost?: number;
          attendance_rate?: number | null;
          sessions_attended?: number;
          sessions_total?: number;
          computed_at?: string;
        };
      };
      player_team_memberships: {
        Row: {
          id: string;
          player_id: string;
          team_id: string;
          season: string;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          player_id: string;
          team_id: string;
          season: string;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          player_id?: string;
          team_id?: string;
          season?: string;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
        };
      };
      players: {
        Row: {
          id: string;
          academy_id: string;
          profile_id: string | null;
          first_name: string;
          last_name: string;
          birth_date: string;
          gender: Database['public']['Enums']['gender'];
          photo_url: string | null;
          dominant_foot: Database['public']['Enums']['dominant_foot'] | null;
          height_cm: number | null;
          weight_kg: number | null;
          preferred_position: string | null;
          experienced_positions: string[];
          jersey_number: number | null;
          joined_at: string;
          status: Database['public']['Enums']['player_status'];
          objectives_note: string | null;
          observations: string | null;
          medical_notes: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          profile_id?: string | null;
          first_name: string;
          last_name: string;
          birth_date: string;
          gender: Database['public']['Enums']['gender'];
          photo_url?: string | null;
          dominant_foot?: Database['public']['Enums']['dominant_foot'] | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          preferred_position?: string | null;
          experienced_positions?: string[];
          jersey_number?: number | null;
          joined_at?: string;
          status?: Database['public']['Enums']['player_status'];
          objectives_note?: string | null;
          observations?: string | null;
          medical_notes?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          profile_id?: string | null;
          first_name?: string;
          last_name?: string;
          birth_date?: string;
          gender?: Database['public']['Enums']['gender'];
          photo_url?: string | null;
          dominant_foot?: Database['public']['Enums']['dominant_foot'] | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          preferred_position?: string | null;
          experienced_positions?: string[];
          jersey_number?: number | null;
          joined_at?: string;
          status?: Database['public']['Enums']['player_status'];
          objectives_note?: string | null;
          observations?: string | null;
          medical_notes?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          academy_id: string;
          role: Database['public']['Enums']['user_role'];
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          locale: string;
          is_active: boolean;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          academy_id: string;
          role: Database['public']['Enums']['user_role'];
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          locale?: string;
          is_active?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          role?: Database['public']['Enums']['user_role'];
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          locale?: string;
          is_active?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string | null;
          phase: Database['public']['Enums']['session_phase'];
          order_index: number;
          duration_min: number;
          custom_title: string | null;
          custom_notes: string | null;
          coaching_points: string[] | null;
          adapted_players_count: number | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id?: string | null;
          phase: Database['public']['Enums']['session_phase'];
          order_index: number;
          duration_min: number;
          custom_title?: string | null;
          custom_notes?: string | null;
          coaching_points?: string[] | null;
          adapted_players_count?: number | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_id?: string | null;
          phase?: Database['public']['Enums']['session_phase'];
          order_index?: number;
          duration_min?: number;
          custom_title?: string | null;
          custom_notes?: string | null;
          coaching_points?: string[] | null;
          adapted_players_count?: number | null;
          completed_at?: string | null;
        };
      };
      session_templates: {
        Row: {
          id: string;
          academy_id: string;
          name: string;
          age_group_id: string | null;
          theme: string | null;
          blocks: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          name: string;
          age_group_id?: string | null;
          theme?: string | null;
          blocks: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          name?: string;
          age_group_id?: string | null;
          theme?: string | null;
          blocks?: Json;
          created_by?: string | null;
          created_at?: string;
        };
      };
      sync_conflicts: {
        Row: {
          id: string;
          academy_id: string;
          actor_id: string | null;
          entity_type: string;
          client_generated_id: string | null;
          payload: Json;
          reason: string;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          actor_id?: string | null;
          entity_type: string;
          client_generated_id?: string | null;
          payload: Json;
          reason: string;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          actor_id?: string | null;
          entity_type?: string;
          client_generated_id?: string | null;
          payload?: Json;
          reason?: string;
          resolved_at?: string | null;
          created_at?: string;
        };
      };
      team_coaches: {
        Row: {
          team_id: string;
          coach_id: string;
          role: string;
          assigned_at: string;
        };
        Insert: {
          team_id: string;
          coach_id: string;
          role?: string;
          assigned_at?: string;
        };
        Update: {
          team_id?: string;
          coach_id?: string;
          role?: string;
          assigned_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          academy_id: string;
          age_group_id: string;
          name: string;
          season: string;
          gender: Database['public']['Enums']['gender'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          age_group_id: string;
          name: string;
          season: string;
          gender?: Database['public']['Enums']['gender'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          age_group_id?: string;
          name?: string;
          season?: string;
          gender?: Database['public']['Enums']['gender'];
          created_at?: string;
          updated_at?: string;
        };
      };
      training_sessions: {
        Row: {
          id: string;
          academy_id: string;
          team_id: string | null;
          age_group_id: string | null;
          coach_id: string | null;
          title: string;
          scheduled_at: string;
          duration_min: number;
          location: string | null;
          objective: string | null;
          theme: string | null;
          main_domain_id: string | null;
          target_competency_ids: string[];
          level: Database['public']['Enums']['exercise_level'];
          players_expected: number | null;
          equipment: Json;
          status: Database['public']['Enums']['session_status'];
          origin: Database['public']['Enums']['session_origin'];
          ai_request_id: string | null;
          coach_notes: string | null;
          debrief: string | null;
          client_generated_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          team_id?: string | null;
          age_group_id?: string | null;
          coach_id?: string | null;
          title: string;
          scheduled_at: string;
          duration_min?: number;
          location?: string | null;
          objective?: string | null;
          theme?: string | null;
          main_domain_id?: string | null;
          target_competency_ids?: string[];
          level?: Database['public']['Enums']['exercise_level'];
          players_expected?: number | null;
          equipment?: Json;
          status?: Database['public']['Enums']['session_status'];
          origin?: Database['public']['Enums']['session_origin'];
          ai_request_id?: string | null;
          coach_notes?: string | null;
          debrief?: string | null;
          client_generated_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          team_id?: string | null;
          age_group_id?: string | null;
          coach_id?: string | null;
          title?: string;
          scheduled_at?: string;
          duration_min?: number;
          location?: string | null;
          objective?: string | null;
          theme?: string | null;
          main_domain_id?: string | null;
          target_competency_ids?: string[];
          level?: Database['public']['Enums']['exercise_level'];
          players_expected?: number | null;
          equipment?: Json;
          status?: Database['public']['Enums']['session_status'];
          origin?: Database['public']['Enums']['session_origin'];
          ai_request_id?: string | null;
          coach_notes?: string | null;
          debrief?: string | null;
          client_generated_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      video_analysis_jobs: {
        Row: {
          id: string;
          academy_id: string;
          match_id: string | null;
          source_url: string;
          source_kind: string | null;
          provider: string | null;
          status: string;
          metrics: Json | null;
          requested_by: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          academy_id: string;
          match_id?: string | null;
          source_url: string;
          source_kind?: string | null;
          provider?: string | null;
          status?: string;
          metrics?: Json | null;
          requested_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          academy_id?: string;
          match_id?: string | null;
          source_url?: string;
          source_kind?: string | null;
          provider?: string | null;
          status?: string;
          metrics?: Json | null;
          requested_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
    };
    Views: {
      v_academy_overview: {
        Row: {
          academy_id: string | null;
          players_count: number | null;
          coaches_count: number | null;
          teams_count: number | null;
          age_groups_count: number | null;
          sessions_30d: number | null;
          active_goals: number | null;
        };
      };
      v_player_attendance: {
        Row: {
          player_id: string | null;
          attended: number | null;
          total: number | null;
          attendance_rate: number | null;
          late_count: number | null;
        };
      };
      v_player_domain_levels: {
        Row: {
          player_id: string | null;
          domain_id: string | null;
          avg_level: number | null;
          sample_size: number | null;
          last_evaluated_at: string | null;
        };
      };
      v_players_coach_safe: {
        Row: {
          id: string | null;
          academy_id: string | null;
          profile_id: string | null;
          first_name: string | null;
          last_name: string | null;
          birth_date: string | null;
          gender: Database['public']['Enums']['gender'] | null;
          photo_url: string | null;
          dominant_foot: Database['public']['Enums']['dominant_foot'] | null;
          preferred_position: string | null;
          experienced_positions: string[] | null;
          jersey_number: number | null;
          joined_at: string | null;
          status: Database['public']['Enums']['player_status'] | null;
          objectives_note: string | null;
          observations: string | null;
          age: number | null;
        };
      };
      v_team_active_goals: {
        Row: {
          team_id: string | null;
          competency_id: string | null;
          players_with_goal: number | null;
        };
      };
      v_team_weakest_competencies: {
        Row: {
          team_id: string | null;
          competency_id: string | null;
          avg_level: number | null;
          players_count: number | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      attendance_status: 'PRESENT' | 'LATE' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED' | 'INJURED';
      dominant_foot: 'LEFT' | 'RIGHT' | 'BOTH';
      evaluation_context: 'SESSION' | 'MATCH' | 'PERIODIC' | 'SELF';
      event_type: 'TRAINING' | 'MATCH' | 'TOURNAMENT' | 'MEETING' | 'TEST' | 'OTHER';
      exercise_level: 'DECOUVERTE' | 'INTERMEDIAIRE' | 'AVANCE';
      gender: 'F' | 'M' | 'MIXED';
      goal_status: 'ACTIVE' | 'ACHIEVED' | 'PAUSED' | 'ARCHIVED';
      match_event_type: 'GOAL' | 'ASSIST' | 'SHOT' | 'CHANCE' | 'RECOVERY' | 'LOSS' | 'DUEL_WON' | 'DUEL_LOST' | 'KEY_PASS' | 'SAVE' | 'YELLOW' | 'RED' | 'SUB_IN' | 'SUB_OUT';
      media_provider: 'SUPABASE' | 'YOUTUBE' | 'VIMEO' | 'CLOUDFLARE';
      player_archetype: 'CREATEUR' | 'DRIBBLEUR' | 'FINISSEUR' | 'ORGANISATEUR' | 'DEFENSEUR' | 'TRANSITION' | 'POLYVALENT';
      player_status: 'ACTIVE' | 'INJURED' | 'ON_LOAN' | 'LEFT' | 'TRIAL';
      session_origin: 'MANUAL' | 'TEMPLATE' | 'RULE_ENGINE' | 'AI';
      session_phase: 'ACCUEIL' | 'ACTIVATION' | 'TECHNIQUE' | 'JEU_REDUIT' | 'JEU_POSITION' | 'SITUATION_REELLE' | 'RETOUR_CALME';
      session_status: 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      user_role: 'SUPER_ADMIN' | 'ACADEMY_DIRECTOR' | 'COACH' | 'PLAYER' | 'PARENT';
    };
  };
}

/** Raccourcis : Tables<'players'> au lieu du chemin complet. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

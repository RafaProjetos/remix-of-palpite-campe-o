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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      api_cache: {
        Row: {
          fetched_at: string
          key: string
          payload: Json
        }
        Insert: {
          fetched_at?: string
          key: string
          payload: Json
        }
        Update: {
          fetched_at?: string
          key?: string
          payload?: Json
        }
        Relationships: []
      }
      bet_picks: {
        Row: {
          away_score: number
          bet_id: string
          home_score: number
          id: string
          match_id: string
          points: number
        }
        Insert: {
          away_score: number
          bet_id: string
          home_score: number
          id?: string
          match_id: string
          points?: number
        }
        Update: {
          away_score?: number
          bet_id?: string
          home_score?: number
          id?: string
          match_id?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "bet_picks_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_picks_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          amount: number
          created_at: string
          full_hits: number | null
          id: string
          league_id: string
          paid_at: string | null
          round_id: string
          status: Database["public"]["Enums"]["bet_status"]
          total_points: number
          updated_at: string
          user_id: string
          winner_hits: number | null
        }
        Insert: {
          amount?: number
          created_at?: string
          full_hits?: number | null
          id?: string
          league_id: string
          paid_at?: string | null
          round_id: string
          status?: Database["public"]["Enums"]["bet_status"]
          total_points?: number
          updated_at?: string
          user_id: string
          winner_hits?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          full_hits?: number | null
          id?: string
          league_id?: string
          paid_at?: string | null
          round_id?: string
          status?: Database["public"]["Enums"]["bet_status"]
          total_points?: number
          updated_at?: string
          user_id?: string
          winner_hits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string | null
          entry_fee: number
          id: string
          name: string
          platform_fee_percent: number
          type: Database["public"]["Enums"]["league_type"]
        }
        Insert: {
          created_at?: string | null
          entry_fee: number
          id?: string
          name: string
          platform_fee_percent?: number
          type: Database["public"]["Enums"]["league_type"]
        }
        Update: {
          created_at?: string | null
          entry_fee?: number
          id?: string
          name?: string
          platform_fee_percent?: number
          type?: Database["public"]["Enums"]["league_type"]
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_logo: string | null
          away_score: number | null
          away_team: string
          created_at: string
          external_id: string | null
          home_logo: string | null
          home_score: number | null
          home_team: string
          id: string
          kickoff_at: string | null
          position: number
          round_id: string
        }
        Insert: {
          away_logo?: string | null
          away_score?: number | null
          away_team: string
          created_at?: string
          external_id?: string | null
          home_logo?: string | null
          home_score?: number | null
          home_team: string
          id?: string
          kickoff_at?: string | null
          position?: number
          round_id: string
        }
        Update: {
          away_logo?: string | null
          away_score?: number | null
          away_team?: string
          created_at?: string
          external_id?: string | null
          home_logo?: string | null
          home_score?: number | null
          home_team?: string
          id?: string
          kickoff_at?: string | null
          position?: number
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bet_id: string
          created_at: string
          id: string
          payment_id: string | null
          preference_id: string | null
          provider: string
          raw: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          bet_id: string
          created_at?: string
          id?: string
          payment_id?: string | null
          preference_id?: string | null
          provider?: string
          raw?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bet_id?: string
          created_at?: string
          id?: string
          payment_id?: string | null
          preference_id?: string | null
          provider?: string
          raw?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          terms_accepted_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          terms_accepted_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          terms_accepted_at?: string | null
        }
        Relationships: []
      }
      rounds: {
        Row: {
          closes_at: string | null
          created_at: string
          entry_fee: number
          id: string
          max_players: number
          number: number
          season: number
          status: Database["public"]["Enums"]["round_status"]
          title: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          entry_fee?: number
          id?: string
          max_players?: number
          number: number
          season?: number
          status?: Database["public"]["Enums"]["round_status"]
          title?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          entry_fee?: number
          id?: string
          max_players?: number
          number?: number
          season?: number
          status?: Database["public"]["Enums"]["round_status"]
          title?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_pick_points: {
        Args: { p_away: number; p_home: number; r_away: number; r_home: number }
        Returns: number
      }
      general_ranking: {
        Args: never
        Returns: {
          full_name: string
          rounds_played: number
          total_points: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_self: { Args: never; Returns: boolean }
      league_stats: {
        Args: {
          _league_type: Database["public"]["Enums"]["league_type"]
          _round_id: string
        }
        Returns: {
          gross_pot: number
          net_pot: number
          platform_fee: number
          total_participants: number
        }[]
      }
      recalculate_partial_scores: {
        Args: { _round_id: string }
        Returns: undefined
      }
      round_league_ranking: {
        Args: {
          _league_type: Database["public"]["Enums"]["league_type"]
          _round_id: string
        }
        Returns: {
          created_at: string
          full_hits: number
          full_name: string
          row_position: number
          total_points: number
          user_id: string
          winner_hits: number
        }[]
      }
      round_ranking: {
        Args: { _round_id: string }
        Returns: {
          full_name: string
          total_points: number
          user_id: string
        }[]
      }
      round_stats: {
        Args: { _round_id: string }
        Returns: {
          max_players: number
          paid_count: number
          total_amount: number
          total_participants: number
        }[]
      }
      update_bet_stats: { Args: { _bet_id: string }; Returns: undefined }
      validate_round: { Args: { _round_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      bet_status: "pending" | "paid" | "cancelled"
      league_type: "free" | "bronze" | "prata" | "ouro"
      round_status: "open" | "closed" | "validated"
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
      app_role: ["admin", "user"],
      bet_status: ["pending", "paid", "cancelled"],
      league_type: ["free", "bronze", "prata", "ouro"],
      round_status: ["open", "closed", "validated"],
    },
  },
} as const

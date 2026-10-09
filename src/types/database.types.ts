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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      auction_state: {
        Row: {
          bid_mode: Database["public"]["Enums"]["bid_mode"]
          current_bid_price: number
          current_highest_team_id: string | null
          current_player_id: string | null
          shuffling_name: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          bid_mode?: Database["public"]["Enums"]["bid_mode"]
          current_bid_price?: number
          current_highest_team_id?: string | null
          current_player_id?: string | null
          shuffling_name?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          bid_mode?: Database["public"]["Enums"]["bid_mode"]
          current_bid_price?: number
          current_highest_team_id?: string | null
          current_player_id?: string | null
          shuffling_name?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_state_current_highest_team_id_fkey"
            columns: ["current_highest_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_state_current_player_id_fkey"
            columns: ["current_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_state_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_events: {
        Row: {
          created_at: string
          id: number
          player_id: string | null
          price: number
          team_id: string | null
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          player_id?: string | null
          price: number
          team_id?: string | null
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: number
          player_id?: string | null
          price?: number
          team_id?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_events_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      player_contacts: {
        Row: {
          created_at: string
          mobile_no: string
          player_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          mobile_no: string
          player_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          mobile_no?: string
          player_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_contacts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_contacts_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      player_group_members: {
        Row: {
          created_at: string
          group_id: string
          player_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          player_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          player_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_group_members_tournament_id_group_id_fkey"
            columns: ["tournament_id", "group_id"]
            isOneToOne: false
            referencedRelation: "player_groups"
            referencedColumns: ["tournament_id", "id"]
          },
          {
            foreignKeyName: "player_group_members_tournament_id_player_id_fkey"
            columns: ["tournament_id", "player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["tournament_id", "id"]
          },
        ]
      }
      player_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_groups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          base_price: number
          category: string | null
          current_team: string | null
          custom_fields: Json
          first_name: string | null
          full_name: string
          id: string
          jersey_no: number | null
          jersey_size: string | null
          photo_url: string | null
          registered_at: string
          selling_price: number | null
          sold_to_team_id: string | null
          status: Database["public"]["Enums"]["player_status"]
          surname: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category?: string | null
          current_team?: string | null
          custom_fields?: Json
          first_name?: string | null
          full_name: string
          id?: string
          jersey_no?: number | null
          jersey_size?: string | null
          photo_url?: string | null
          registered_at?: string
          selling_price?: number | null
          sold_to_team_id?: string | null
          status?: Database["public"]["Enums"]["player_status"]
          surname?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string | null
          current_team?: string | null
          custom_fields?: Json
          first_name?: string | null
          full_name?: string
          id?: string
          jersey_no?: number | null
          jersey_size?: string | null
          photo_url?: string | null
          registered_at?: string
          selling_price?: number | null
          sold_to_team_id?: string | null
          status?: Database["public"]["Enums"]["player_status"]
          surname?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_sold_to_team_id_fkey"
            columns: ["sold_to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          captain_name: string | null
          created_at: string
          id: string
          max_players: number | null
          photo_url: string | null
          points_remaining: number
          team_name: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          captain_name?: string | null
          created_at?: string
          id?: string
          max_players?: number | null
          photo_url?: string | null
          points_remaining?: number
          team_name: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          captain_name?: string | null
          created_at?: string
          id?: string
          max_players?: number | null
          photo_url?: string | null
          points_remaining?: number
          team_name?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          auction_start_at: string | null
          created_at: string
          form_config: Json
          grouping_enabled: boolean
          id: string
          name: string
          registration_enabled: boolean
          slug: string
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          auction_start_at?: string | null
          created_at?: string
          form_config?: Json
          grouping_enabled?: boolean
          id?: string
          name: string
          registration_enabled?: boolean
          slug: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          auction_start_at?: string | null
          created_at?: string
          form_config?: Json
          grouping_enabled?: boolean
          id?: string
          name?: string
          registration_enabled?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finalize_on_block: {
        Args: { p_player_id: string; p_tournament_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      pass_player: {
        Args: { p_player_id: string; p_tournament_id: string }
        Returns: undefined
      }
      place_bid: {
        Args: { p_team_id: string; p_tournament_id: string }
        Returns: number
      }
      revert_last_bid: { Args: { p_tournament_id: string }; Returns: undefined }
      revert_sale: {
        Args: { p_player_id: string; p_tournament_id: string }
        Returns: undefined
      }
      sell_player: {
        Args: {
          p_player_id: string
          p_price: number
          p_team_id: string
          p_tournament_id: string
        }
        Returns: undefined
      }
      start_shuffle: {
        Args: { p_shuffling_name: string; p_tournament_id: string }
        Returns: undefined
      }
    }
    Enums: {
      bid_mode: "normal" | "star"
      player_status: "pending" | "on_block" | "sold" | "unsold" | "skipped"
      tournament_status:
        | "draft"
        | "registration"
        | "ready"
        | "live"
        | "ended"
        | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      bid_mode: ["normal", "star"],
      player_status: ["pending", "on_block", "sold", "unsold", "skipped"],
      tournament_status: [
        "draft",
        "registration",
        "ready",
        "live",
        "ended",
        "archived",
      ],
    },
  },
} as const

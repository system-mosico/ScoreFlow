import { CreateTournamentClient } from "./CreateTournamentClient";

// 動的レンダリングを強制（Firebase Authを使用するため）
export const dynamic = 'force-dynamic';

export default function CreateTournamentPage() {
  return <CreateTournamentClient />;
}


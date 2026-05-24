import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Props {
  articleId: string;
  likesCount: number;
  hasLiked: boolean;
  onToggle: () => void;
}

export default function LikeButton({
  likesCount,
  hasLiked,
  onToggle,
}: Props) {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-5 py-2.5 border transition-all duration-300 font-display text-sm ${
        hasLiked
          ? "bg-rust-500 border-rust-500 text-white"
          : "border-ink-200 text-ink-500 hover:border-rust-300 hover:text-rust-500"
      }`}
    >
      <i
        className={`fa-regular ${hasLiked ? "fa-solid fa-heart" : "fa-heart"}`}
      />
      <span>{likesCount}</span>
    </button>
  );
}

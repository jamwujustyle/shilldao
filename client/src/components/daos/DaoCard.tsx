import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DaoType } from "@/types/dao";
import { ArrowUpRight, CheckCircle, Heart, Star, XCircle } from "lucide-react";
import Image from "next/image"; // Import Image component

interface DaoCardProps {
  dao: DaoType;
  onDaoClick: (dao: DaoType) => void;
  onToggleFavorite: (e: React.MouseEvent, daoId: number) => void;
  isToggleFavoritePending: boolean;
  toggleFavoriteDaoId: number | null;
}

const DaoCard: React.FC<DaoCardProps> = ({
  dao,
  onDaoClick,
  onToggleFavorite,
  isToggleFavoritePending,
  toggleFavoriteDaoId,
}) => {
  return (
    <Card
      key={dao.id}
      className="overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group cursor-pointer"
      onClick={() => onDaoClick(dao)}
    >
      <div className="aspect-square w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 relative">
        {dao.image ? (
          <Image
            src={dao.image}
            alt={dao.name}
            width={300} // Example width, adjust as needed
            height={300} // Example height, adjust as needed
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-semibold text-blue-200 dark:text-blue-800">
              {dao.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white flex items-center">
            View Details <ArrowUpRight className="ml-2" size={16} />
          </span>
        </div>

        <button
          className={`absolute top-3 left-3 p-2 rounded-full bg-gray-200/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:scale-110 transition-all disabled:opacity-50`}
          onClick={(e) => onToggleFavorite(e, dao.id)}
          aria-label={
            dao.isFavorited ? "Remove from favorites" : "Add to favorites"
          }
          disabled={isToggleFavoritePending && toggleFavoriteDaoId === dao.id}
        >
          <Heart
            size={16}
            className={dao.isFavorited ? "text-red-500" : "text-inherit"}
            fill={dao.isFavorited ? "red" : "none"}
          />
        </button>
      </div>
      <CardContent className="pt-4">
        <h3 className="text-lg font-semibold truncate">{dao.name}</h3>
      </CardContent>
      <CardFooter className="border-t border-border px-4 py-3 flex justify-between bg-muted/40">
        <div
          className="flex items-center text-sm text-muted-foreground"
          title={
            dao.createDao
              ? "Registered on Create DAO "
              : "Not registered on Create DAO"
          }
        >
          {dao.createDao ? (
            <CheckCircle size={14} className="mr-1 text-green-500" />
          ) : (
            <XCircle size={14} className="mr-1 text-red-500" />
          )}
          Create DAO
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Star size={14} className="mr-1" />
          <span>{dao.campaigns?.length || 0} campaigns</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DaoCard;

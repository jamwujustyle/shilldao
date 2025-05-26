import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"; // Import DialogTitle
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DaoType } from "@/types/dao"; // Assuming CampaignType is in dao.ts or imported elsewhere
import { CampaignType } from "@/types/campaign";
import {
  Globe,
  Star,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  X,
  Heart,
} from "lucide-react";
import Image from "next/image"; // Import Image component

interface DaoDetailDialogProps {
  dao: DaoType | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (e: React.MouseEvent, daoId: number) => void;
  isToggleFavoritePending: boolean;
  toggleFavoriteDaoId: number | null;
  onCampaignClick: (campaign: CampaignType, e: React.MouseEvent) => void; // For opening details dialog
  onNavigateToCampaign: (campaign: CampaignType, e: React.MouseEvent) => void; // For navigating to campaign page
}

const DaoDetailDialog: React.FC<DaoDetailDialogProps> = ({
  dao,
  isOpen,
  onClose,
  onToggleFavorite,
  isToggleFavoritePending,
  toggleFavoriteDaoId,
  onCampaignClick, // This is for the card click (opens dialog)
  onNavigateToCampaign, // This is for the button click (navigates)
}) => {
  if (!dao) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[95vh]">
        <div className="relative h-40 sm:h-60 w-full bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
          {dao.image && (
            <Image
              src={dao.image}
              alt={dao.name}
              width={600} // Example width
              height={240} // Example height (matches sm:h-60)
              className="w-full h-full object-cover"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 rounded-full bg-black/20 hover:bg-black/40 text-white"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
          <button
            className={`absolute top-4 left-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white disabled:opacity-50`}
            onClick={(e) => {
              e.stopPropagation(); // Keep this if the button is inside another clickable area
              onToggleFavorite(e, dao.id);
            }}
            aria-label={
              dao.isFavorited ? "Remove from favorites" : "Add to favorites'"
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
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-background -mt-12">
                {dao.image ? (
                  <Image
                    src={dao.image}
                    alt={dao.name}
                    width={64} // Corresponds to h-16 w-16
                    height={64} // Corresponds to h-16 w-16
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  dao.name.charAt(0)
                )}
              </div>
              <div>
                <DialogTitle asChild>
                  <h2 className="text-2xl font-bold flex items-center">
                    {dao.name}
                  </h2>
                </DialogTitle>
                <div className="flex items-center gap-3 mt-1">
                  {dao.website && (
                    <a
                      href={dao.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                    >
                      <Globe size={14} className="mr-1" /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {dao.socialLinks &&
                Object.entries(dao.socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground"
                    title={platform}
                  >
                    {platform === "twitter" ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-blue-500"
                      >
                        <path
                          d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : platform === "discord" ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-indigo-500"
                      >
                        <path
                          d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : platform === "telegram" ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-blue-400"
                      >
                        <path
                          d="M22.05 1.577c-.393-.016-.784.08-1.117.235-.484.186-2.594 1.09-4.659 1.983-2.074.9-4.627 2.003-6.765 2.92-4.442 1.918-4.664 2.013-4.664 2.013l.002-.001c-.211.07-.5.207-.562.545-.065.34.088.662.399.815 0 0 1.463.557 2.399.903 1.873.696 2.256.707 2.432.996.175.29.161.577.161.577V16.673c0 .063.018.125.05.182.32.57.113.1.205.119.092.019.187-.008.256-.079l2.033-2.08c.094-.095.224-.15.358-.154l3.17-.265c.332-.025.665.183.801.486.14.305.065.664-.199.898l-1.795 1.583c-.033.03-.048.074-.041.117.006.043.037.08.078.098l5.459 2.277a.949.949 0 00.974-.086.85.85 0 00.365-.854l-1.915-12.042c-.082-.522-.5-.944-1.03-.997zM19.232 17.377l-4.188-1.747c-.062-.026-.134-.012-.183.036l-1.364 1.314-1.859-1.45c-.046-.037-.111-.037-.158 0l-1.953 1.671v-3.572l9.063-5.597c.21-.127.285-.387.173-.591-.113-.204-.373-.28-.588-.176l-11.833 5.609-2.284-.86c.012-.002 1.011-.374 2.43-.9l.758-.3c1.748-.753 3.522-1.517 4.646-1.992 2.069-.893 4.191-1.804 4.672-1.99.408-.157.487.053.455.142l-1.867 11.766c-.018.117.059.226.174.247z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <Globe size={16} className="text-gray-500" />
                    )}
                  </a>
                ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-full bg-indigo-100 dark:bg-indigo-900 p-3 mb-2">
                  <Star
                    size={20}
                    className="text-indigo-600 dark:text-indigo-300"
                  />
                </div>
                <span className="text-3xl font-bold">
                  {dao.campaigns?.length || 0}
                </span>
                <span className="text-sm text-muted-foreground mt-1">
                  Campaigns
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mb-2">
                  <Calendar
                    size={20}
                    className="text-purple-600 dark:text-purple-300"
                  />
                </div>
                <span className="text-3xl font-bold">
                  {new Date(dao.createdAt).getFullYear()}
                </span>
                <span className="text-sm text-muted-foreground mt-1">
                  Joined
                </span>
              </CardContent>
            </Card>
          </div>
          <Tabs defaultValue="campaigns" className="mt-8">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            <TabsContent value="campaigns" className="mt-4">
              {dao.campaigns?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dao.campaigns.map((campaign) => (
                    <Card
                      key={campaign.id}
                      className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                      onClick={(e) => onCampaignClick(campaign, e)} // Card click opens details
                    >
                      <div className="p-4 border-b border-border relative">
                        <Badge
                          className={`absolute top-4 right-4 ${
                            campaign.status === "Active"
                              ? "bg-green-500 hover:bg-green-600"
                              : campaign.status === "Planning"
                              ? "bg-blue-500 hover:bg-blue-600"
                              : campaign.status === "On Hold"
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-gray-500 hover:bg-gray-600"
                          } text-white border-none`}
                        >
                          {campaign.status}
                        </Badge>
                        <h3 className="font-medium text-lg pr-16">
                          {campaign.name}
                        </h3>
                        <div className="flex items-center mt-3 text-sm">
                          <TrendingUp
                            size={14}
                            className="mr-1 text-muted-foreground"
                          />
                          <span className="text-muted-foreground">
                            {campaign.progress}% Complete
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span className="font-medium">
                              {campaign.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`rounded-full h-2 ${
                                campaign.progress >= 75
                                  ? "bg-green-500"
                                  : campaign.progress >= 50
                                  ? "bg-blue-500"
                                  : campaign.progress >= 25
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${campaign.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <div>
                            <span className="text-sm text-muted-foreground">
                              Budget
                            </span>
                            <p className="font-medium">
                              {campaign.budget.toLocaleString()}
                            </p>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-muted-foreground"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 w-full"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card's onClick from firing
                            onNavigateToCampaign(campaign, e); // Button click navigates
                          }}
                        >
                          View Campaign{" "}
                          <ArrowUpRight size={14} className="ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full p-6 bg-muted">
                    <Star size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-lg font-medium">
                    No Active Campaigns
                  </h3>
                  <p className="mt-2 text-muted-foreground max-w-md">
                    This DAO doesn&apos;t have any campaigns yet.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="about" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Description
                      </h3>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {dao.description || "No description provided."}
                      </p>
                    </div>
                    {dao.website && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Website
                        </h3>
                        <a
                          href={dao.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        >
                          <Globe size={14} className="mr-2" />
                          {dao.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                    {dao.createDao && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Create DAO Profile
                        </h3>
                        <a
                          href="https://createdao.org/daos" // hardcoded here
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        >
                          <ArrowUpRight size={14} className="mr-2" />
                          View on Create DAO
                        </a>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Created
                      </h3>
                      <p>
                        {new Date(dao.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {dao.network !== undefined && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Network ID
                        </h3>
                        <p>{dao.network}</p>
                      </div>
                    )}
                    {dao.createdBy !== undefined && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Created By
                        </h3>
                        <p className="break-all">{dao.createdBy}</p>
                      </div>
                    )}
                    {dao.balance !== undefined && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Balance
                        </h3>
                        <p>{dao.balance}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DaoDetailDialog;

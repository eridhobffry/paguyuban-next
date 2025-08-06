"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccessRequest } from "@/types/admin";

interface ProcessedRequestsProps {
  requests: AccessRequest[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function ProcessedRequests({ requests }: ProcessedRequestsProps) {
  const processedRequests = requests.filter((req) => req.status !== "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
        <CardDescription>
          Previously approved or rejected requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {processedRequests.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No processed requests yet.
          </p>
        ) : (
          <div className="space-y-4">
            {processedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{request.email}</p>
                  <p className="text-sm text-gray-500">
                    Requested:{" "}
                    {new Date(request.requested_at).toLocaleDateString()}
                    {request.approved_at && (
                      <>
                        {" • "}
                        Processed:{" "}
                        {new Date(request.approved_at).toLocaleDateString()}
                      </>
                    )}
                  </p>
                </div>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

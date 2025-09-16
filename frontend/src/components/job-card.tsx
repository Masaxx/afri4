import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar, 
  Star, 
  MessageSquare, 
  Clock,
  DollarSign,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";

interface Job {
  id: number;
  cargoType: string;
  cargoWeight: number;
  cargoVolume?: number;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCountry: string;
  deliveryCountry: string;
  industry: string;
  paymentAmount: number;
  paymentTerms?: string;
  status: string;
  createdAt: string;
  pickupDate: string;
  deliveryDeadline?: string;
  specialHandling?: string;
  insuranceRequired?: boolean;
  notes?: string;
  shipperId?: number;
  carrierId?: number;
  takenAt?: string;
  completedAt?: string;
}

interface JobCardProps {
  job: Job;
  userRole: 'trucking_company' | 'shipping_entity';
  onTakeJob?: (jobId: number) => void;
  onCompleteJob?: (jobId: number) => void;
  showManageActions?: boolean;
  isLoading?: boolean;
}

export function JobCard({ 
  job, 
  userRole, 
  onTakeJob, 
  onCompleteJob,
  showManageActions = false,
  isLoading = false 
}: JobCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-blue-100 text-blue-800';
      case 'taken':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'taken':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCountryName = (code: string) => {
    const countries = {
      'BWA': 'Botswana',
      'ZAF': 'South Africa', 
      'NAM': 'Namibia',
      'ZWE': 'Zimbabwe',
      'ZMB': 'Zambia'
    };
    return countries[code as keyof typeof countries] || code;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`job-card-${job.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground" data-testid="job-title">
                {job.cargoType} Transport - {job.cargoWeight}kg
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Cargo:</span>
                <span className="font-medium" data-testid="job-cargo">
                  {job.cargoType} - {job.cargoWeight}kg
                  {job.cargoVolume && `, ${job.cargoVolume}m³`}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Route:</span>
                <span className="font-medium" data-testid="job-route">
                  {getCountryName(job.pickupCountry)} → {getCountryName(job.deliveryCountry)}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Truck className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Industry:</span>
                <span className="font-medium capitalize" data-testid="job-industry">
                  {job.industry}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Payment:</span>
                <span className="font-medium" data-testid="job-payment">
                  BWP {job.paymentAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-3 text-sm text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <strong>Pickup:</strong> {job.pickupAddress}
                </div>
                <div>
                  <strong>Delivery:</strong> {job.deliveryAddress}
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            {(job.specialHandling || job.insuranceRequired || job.notes) && (
              <div className="mt-3 space-y-1">
                {job.specialHandling && (
                  <div className="text-sm">
                    <strong>Special Handling:</strong> {job.specialHandling}
                  </div>
                )}
                {job.insuranceRequired && (
                  <Badge variant="outline" className="text-xs">
                    Insurance Required
                  </Badge>
                )}
                {job.notes && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Notes:</strong> {job.notes}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Badge className={getStatusColor(job.status)} data-testid="job-status">
              {getStatusText(job.status)}
            </Badge>
            
            {/* Action Buttons */}
            {userRole === 'trucking_company' && job.status === 'available' && onTakeJob && (
              <Button 
                size="sm"
                onClick={() => onTakeJob(job.id)}
                disabled={isLoading}
                data-testid="take-job-button"
              >
                {isLoading ? "Taking..." : "Take Job"}
              </Button>
            )}
            
            {showManageActions && job.status === 'taken' && userRole === 'shipping_entity' && onCompleteJob && (
              <Button 
                size="sm"
                variant="outline"
                onClick={() => onCompleteJob(job.id)}
                disabled={isLoading}
                data-testid="complete-job-button"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {isLoading ? "Completing..." : "Mark Complete"}
              </Button>
            )}
            
            {(job.status === 'taken' || job.status === 'completed') && (
              <Link href={`/chat/${job.id}`}>
                <Button size="sm" variant="outline" data-testid="chat-button">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Posted {formatDate(job.createdAt)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Pickup: {formatDate(job.pickupDate)}</span>
            </div>
            
            {job.deliveryDeadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Deadline: {formatDate(job.deliveryDeadline)}</span>
              </div>
            )}
            
            {job.completedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Completed {formatDate(job.completedAt)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <span>ID: {job.id.toString().slice(-6).toUpperCase()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

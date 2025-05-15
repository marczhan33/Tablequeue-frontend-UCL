import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Printer, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeGeneratorProps {
  restaurantId: number;
  restaurantName: string;
}

export function QRCodeGenerator({ restaurantId, restaurantName }: QRCodeGeneratorProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateQrMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        `/api/restaurants/${restaurantId}/qr-code`, 
        { method: 'POST' }
      );
      return response.json();
    },
    onSuccess: (data) => {
      setQrCodeImage(data.qrCodeImage);
      setQrCodeUrl(data.qrCodeUrl);
      toast({
        title: 'QR Code Generated',
        description: 'Your waitlist QR code has been generated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to generate QR code: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleDownload = () => {
    if (!qrCodeImage) return;
    
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `${restaurantName.replace(/\s+/g, '-')}-waitlist-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!qrCodeImage) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Error',
        description: 'Failed to open print window. Please check your popup settings.',
        variant: 'destructive',
      });
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Waitlist QR Code - ${restaurantName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            .restaurant-name {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            p {
              margin-bottom: 20px;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .footer {
              margin-top: 20px;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="restaurant-name">${restaurantName}</div>
            <h1>Join Our Waitlist</h1>
            <p>Scan this QR code to join our waitlist from your mobile device</p>
            <img src="${qrCodeImage}" alt="Waitlist QR Code" />
            <div class="footer">
              <p>Powered by LineWaitTracker</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.setTimeout(function() {
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleShare = async () => {
    if (!qrCodeUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurantName} Waitlist`,
          text: `Join the waitlist for ${restaurantName}`,
          url: qrCodeUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fall back to clipboard
        handleCopyLink();
      }
    } else {
      // No web share API support
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    if (!qrCodeUrl) return;
    
    navigator.clipboard.writeText(qrCodeUrl)
      .then(() => {
        toast({
          title: 'Link Copied',
          description: 'QR code link has been copied to your clipboard.',
        });
      })
      .catch(err => {
        toast({
          title: 'Error',
          description: 'Failed to copy link to clipboard.',
          variant: 'destructive',
        });
      });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Waitlist QR Code</CardTitle>
        <CardDescription>
          Generate a QR code that customers can scan to join your waitlist.
          Print and place this QR code at your restaurant entrance or host stand.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {qrCodeImage ? (
          <div className="flex flex-col items-center">
            <Tabs defaultValue="qrcode" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qrcode">QR Code</TabsTrigger>
                <TabsTrigger value="instructions">Usage Instructions</TabsTrigger>
              </TabsList>
              <TabsContent value="qrcode" className="flex flex-col items-center">
                <div className="mb-4 border p-4 rounded-lg">
                  <img
                    src={qrCodeImage}
                    alt="Restaurant Waitlist QR Code"
                    className="max-w-full h-auto"
                    style={{ width: '250px', height: '250px' }}
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Customers can scan this QR code to join your waitlist and receive updates
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  <Button onClick={handlePrint} variant="outline" size="sm">
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                  <Button onClick={handleShare} variant="outline" size="sm">
                    <Share2 className="mr-2 h-4 w-4" /> Share Link
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="instructions">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">1. Print your QR code</h3>
                    <p className="text-sm text-muted-foreground">
                      Print multiple copies and place them at your entrance, host stand,
                      and other visible areas.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">2. Add instructions</h3>
                    <p className="text-sm text-muted-foreground">
                      Add a sign instructing customers to scan the QR code to join your 
                      waitlist. Consider including benefits like "Skip the line" or "Get notified 
                      when your table is ready."
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">3. Train your staff</h3>
                    <p className="text-sm text-muted-foreground">
                      Ensure your staff knows how to assist customers with scanning the QR code
                      and how to manage the digital waitlist.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8">
            <div className="bg-gray-100 w-48 h-48 rounded-lg flex items-center justify-center mb-4">
              <div className="text-4xl text-gray-300">QR</div>
            </div>
            <p className="text-sm text-center text-muted-foreground mb-6">
              Generate a QR code for customers to quickly join your waitlist
            </p>
            <Button 
              onClick={() => generateQrMutation.mutate()} 
              disabled={generateQrMutation.isPending}
            >
              {generateQrMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate QR Code'
              )}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-xs text-center text-muted-foreground">
          This QR code is unique to your restaurant and will remain valid until you generate a new one.
        </p>
      </CardFooter>
    </Card>
  );
}